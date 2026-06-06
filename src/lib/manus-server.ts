import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

/**
 * Manus AI publishing service (server-only).
 *
 * Replaces direct Instagram Graph API publishing. We send a task to the Manus
 * agent, which dispatches the actual platform call through its connector. Keep
 * MANUS_API_KEY strictly on the server — never expose via VITE_ env vars.
 *
 * Docs:
 *   - Auth:        https://open.manus.ai/docs/v2/authentication
 *   - task.create: https://open.manus.ai/docs/api-reference/create-task
 *   - Lifecycle:   https://open.manus.ai/docs/v2/task-lifecycle
 *   - Connectors:  https://open.manus.ai/docs/v2/connectors
 */

const MANUS_BASE = "https://api.manus.ai";

export type ManusPlatform = "instagram" | "facebook";

/** Feed = grid post; Story = Manus-led creative for 9:16 + Instagram Story publish (Instagram only). */
export type ManusPlacement = "feed" | "story";

export interface PublishViaManusInput {
  imageUrl: string;
  caption: string;
  platform: ManusPlatform;
  productId?: string;
  placement?: ManusPlacement;
}

export interface PublishViaManusResult {
  ok: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
  taskId?: string;
  rawText?: string;
  /** When placement is "story" — short description of the creative Manus applied. */
  storyDesignSummary?: string;
}

interface ManusErrorBody {
  ok?: false;
  error?: { code?: string; message?: string };
}

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function manusFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const key = process.env.MANUS_API_KEY;
  if (!key) {
    throw new Error(
      "MANUS_API_KEY is not configured. Set it in .env (server-side, no VITE_ prefix).",
    );
  }

  const res = await fetch(`${MANUS_BASE}${path}`, {
    ...init,
    headers: {
      "x-manus-api-key": key,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new Error(`Manus ${res.status}: non-JSON response`);
  }

  const okFlag = isRecord(json) ? json.ok : undefined;
  if (!res.ok || okFlag === false) {
    const errBody = (isRecord(json) ? json : {}) as ManusErrorBody;
    const msg =
      errBody?.error?.message ??
      `Manus request failed (${res.status} ${errBody?.error?.code ?? "unknown"})`;
    throw new Error(msg);
  }

  return json as T;
}

function connectorIdFor(platform: ManusPlatform): string {
  const map: Record<ManusPlatform, string | undefined> = {
    instagram: process.env.MANUS_IG_CONNECTOR_ID,
    facebook: process.env.MANUS_FB_CONNECTOR_ID,
  };
  const id = map[platform];
  if (!id) {
    throw new Error(
      `No Manus connector configured for ${platform}. ` +
        `Set MANUS_${platform.toUpperCase()}_CONNECTOR_ID in .env.`,
    );
  }
  return id;
}

const STRUCTURED_OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["success", "post_id", "post_url", "error"],
  properties: {
    success: {
      type: "boolean",
      description: "True if the post was published successfully.",
    },
    post_id: {
      type: "string",
      description: "Platform-assigned post id, or empty string on failure.",
    },
    post_url: {
      type: "string",
      description: "Public URL to the published post, or empty string on failure.",
    },
    error: {
      type: "string",
      description: "Empty string on success; human-readable error on failure.",
    },
  },
};

const STORY_STRUCTURED_OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["success", "post_id", "post_url", "error", "story_design_summary"],
  properties: {
    success: {
      type: "boolean",
      description: "True if the Instagram Story was published successfully.",
    },
    post_id: {
      type: "string",
      description: "Platform-assigned story/media id, or empty string on failure.",
    },
    post_url: {
      type: "string",
      description: "URL or deep link if available; empty string if not applicable.",
    },
    error: {
      type: "string",
      description: "Empty string on success; human-readable error on failure.",
    },
    story_design_summary: {
      type: "string",
      description:
        "2–4 sentences: designed layout (type, margins, backgrounds, accents) plus confirmation product matched upload unchanged.",
    },
  },
};

/**
 * Walk through a Manus task.listMessages response and pull out the structured
 * output object we asked for via `structured_output_schema`. The exact field
 * path can vary by Manus version, so we look in a few common locations.
 */
interface StructuredOutput {
  success: boolean;
  post_id: string;
  post_url: string;
  error: string;
  story_design_summary?: string;
}

function isStructuredOutput(value: unknown): value is StructuredOutput {
  if (!isRecord(value)) return false;
  return (
    typeof value.success === "boolean" &&
    typeof value.post_id === "string" &&
    typeof value.post_url === "string" &&
    typeof value.error === "string"
  );
}

function isStoryStructuredOutput(value: unknown): value is StructuredOutput {
  if (!isStructuredOutput(value)) return false;
  return typeof value.story_design_summary === "string";
}

function extractStructuredOutput(resp: unknown): StructuredOutput | null {
  const candidates: unknown[] = [];

  if (isRecord(resp)) {
    if (resp.structured_output) candidates.push(resp.structured_output);
    if (resp.output) candidates.push(resp.output);
    if (isRecord(resp.data)) {
      if (resp.data.structured_output) candidates.push(resp.data.structured_output);
      if (resp.data.output) candidates.push(resp.data.output);
    }

    const messagesRaw = (isRecord(resp.data) ? resp.data.messages : undefined) ?? resp.messages;
    if (Array.isArray(messagesRaw)) {
      for (const m of messagesRaw) {
        if (!isRecord(m)) continue;
        if (m.structured_output) candidates.push(m.structured_output);
        if (m.output) candidates.push(m.output);
        if (isRecord(m.content) && m.content.structured_output) {
          candidates.push(m.content.structured_output);
        }
      }
    }
  }

  for (const c of candidates) {
    if (isStructuredOutput(c)) return c;
    if (typeof c === "string") {
      try {
        const parsed = JSON.parse(c);
        if (isStructuredOutput(parsed)) return parsed;
      } catch {
        // not JSON, keep looking
      }
    }
  }

  return null;
}

function extractStoryStructuredOutput(resp: unknown): StructuredOutput | null {
  const candidates: unknown[] = [];

  if (isRecord(resp)) {
    if (resp.structured_output) candidates.push(resp.structured_output);
    if (resp.output) candidates.push(resp.output);
    if (isRecord(resp.data)) {
      if (resp.data.structured_output) candidates.push(resp.data.structured_output);
      if (resp.data.output) candidates.push(resp.data.output);
    }

    const messagesRaw = (isRecord(resp.data) ? resp.data.messages : undefined) ?? resp.messages;
    if (Array.isArray(messagesRaw)) {
      for (const m of messagesRaw) {
        if (!isRecord(m)) continue;
        if (m.structured_output) candidates.push(m.structured_output);
        if (m.output) candidates.push(m.output);
        if (isRecord(m.content) && m.content.structured_output) {
          candidates.push(m.content.structured_output);
        }
      }
    }
  }

  for (const c of candidates) {
    if (isStoryStructuredOutput(c)) return c;
    if (typeof c === "string") {
      try {
        const parsed = JSON.parse(c);
        if (isStoryStructuredOutput(parsed)) return parsed;
      } catch {
        // not JSON
      }
    }
  }

  return null;
}

function pickTaskStatus(resp: unknown): string | undefined {
  if (!isRecord(resp)) return undefined;
  const direct = resp.status;
  if (typeof direct === "string") return direct;
  const nested = isRecord(resp.data) ? resp.data.status : undefined;
  if (typeof nested === "string") return nested;
  const task = isRecord(resp.task) ? resp.task.status : undefined;
  if (typeof task === "string") return task;
  return undefined;
}

function platformLabel(p: ManusPlatform): string {
  return p === "instagram" ? "Instagram" : "Facebook";
}

async function createAndAwaitTask(input: PublishViaManusInput): Promise<PublishViaManusResult> {
  const { imageUrl, caption, platform, productId, placement = "feed" } = input;
  const connectorId = connectorIdFor(platform);
  const isStory = placement === "story";

  const prompt = isStory
    ? `You are publishing to INSTAGRAM STORIES (vertical 9:16), NOT the main feed.\n\n` +
      `Use the connected Instagram account via the Instagram connector.\n\n` +
      `NON-NEGOTIABLE — THE PRODUCT MUST NOT CHANGE:\n` +
      `- The product in the final Story must be the SAME product as in the image URL below: same colors, shape, fabric, print, labels, and details. The customer must recognize it as the exact photo they uploaded.\n` +
      `- Do not replace, redraw, or AI-regenerate the product. Do not use a different stock photo or a "similar" item.\n` +
      `- Do not apply beauty filters, heavy color grading, sharpening, or effects that alter how the product looks. No liquify, warp, or perspective tricks on the product.\n` +
      `- You may ONLY uniformly scale and position the product image (like object-fit: contain) and add empty margin / letterbox around it. Do not crop into the product or cut off edges.\n\n` +
      `ALLOWED — MAKE THE STORY FEEL CLEARLY DESIGNED (still never change the product pixels):\n` +
      `- Aim for a polished editorial / boutique Story: the margins and letterbox are your canvas — use them generously for layout, not the product region.\n` +
      `- Backgrounds in non-product areas: soft gradients, layered shapes, very subtle pattern or paper texture, or a gentle color wash — keep contrast calm so the product photo still reads true when placed on top (no tint overlay on the product itself).\n` +
      `- Typography: use a clear hierarchy — headline + supporting line + optional CTA or "New" / "Just dropped" micro-label in safe zones. Pair fonts thoughtfully (e.g. elegant serif with clean sans). Text must stay in Instagram safe zones.\n` +
      `- Decorative chrome: thin rules, corner brackets, small logo lockup, delicate divider, or a soft vignette that only darkens the far edges of the canvas (not the product center).\n` +
      `- Optional tasteful sticker-style icons or sparkles only in margins — never covering the product.\n` +
      `- One strong composed frame is ideal; a short 2-slide sequence is OK if supported, with consistent art direction.\n` +
      `- Brand vibe: "Little Luxuries" — luxury baby, soft premium palette, refined and cohesive — but the product image remains the untouched hero.\n\n` +
      `Image URL (this IS the product photo — preserve it):\n${imageUrl}\n\n` +
      `Product / caption context:\n---\n${caption}\n---\n\n` +
      (productId ? `Internal product reference: ${productId}\n` : "") +
      `PUBLISH: Publish as an Instagram Story (photo or video as supported). ` +
      `If Stories are not supported, set success=false and explain in error.\n\n` +
      `story_design_summary: 2–4 sentences — the designed elements (layout, type, background treatment, accents) and explicit confirmation the product image stayed pixel-true to the upload. ` +
      `Use post_id/post_url when returned; otherwise empty strings.\n`
    : `Publish a single-image ${platformLabel(platform)} post using the connected ` +
      `${platformLabel(platform)} account.\n\n` +
      `Image URL (publicly accessible): ${imageUrl}\n\n` +
      `Use this caption EXACTLY as written, do not paraphrase, do not add or remove ` +
      `hashtags, do not translate:\n` +
      `---\n${caption}\n---\n\n` +
      (productId ? `Internal product reference: ${productId}\n` : "") +
      `After publishing, return the resulting post id and public URL. ` +
      `If publishing fails for any reason, set success=false and put the platform ` +
      `error message in the error field.`;

  const schema = isStory ? STORY_STRUCTURED_OUTPUT_SCHEMA : STRUCTURED_OUTPUT_SCHEMA;
  const title = isStory
    ? `Instagram Story (Manus)${productId ? ` — ${productId}` : ""}`
    : `Publish to ${platformLabel(platform)}${productId ? ` — ${productId}` : ""}`;

  const created = await manusFetch<{ task_id?: string }>("/v2/task.create", {
    method: "POST",
    body: JSON.stringify({
      message: {
        content: [{ type: "text", text: prompt }],
        connectors: [connectorId],
      },
      hide_in_task_list: true,
      title,
      structured_output_schema: schema,
    }),
  });

  const taskId: string | undefined = created?.task_id;
  if (!taskId) {
    return {
      ok: false,
      error: "Manus did not return a task_id",
    };
  }

  const startedAt = Date.now();
  const timeoutMs = 90_000;
  const pollMs = 2_000;

  while (Date.now() - startedAt < timeoutMs) {
    await new Promise((r) => setTimeout(r, pollMs));

    let status: unknown;
    try {
      status = await manusFetch<unknown>(
        `/v2/task.listMessages?task_id=${encodeURIComponent(taskId)}`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[manus] poll error for ${taskId}: ${message}`);
      continue;
    }

    const structured = isStory
      ? extractStoryStructuredOutput(status)
      : extractStructuredOutput(status);
    if (structured) {
      return {
        ok: structured.success,
        postId: structured.post_id || undefined,
        postUrl: structured.post_url || undefined,
        error: structured.success ? undefined : structured.error || "Unknown error",
        taskId,
        storyDesignSummary: structured.story_design_summary,
      };
    }

    const taskStatus = pickTaskStatus(status);
    if (taskStatus === "failed" || taskStatus === "error" || taskStatus === "cancelled") {
      return {
        ok: false,
        error: `Manus task ended with status: ${taskStatus}`,
        taskId,
      };
    }
  }

  return {
    ok: false,
    error: `Manus task did not complete within ${timeoutMs / 1000}s`,
    taskId,
  };
}

export const publishViaManus = createServerFn({ method: "POST" }).handler(async (ctx) => {
  const data = ctx.data as unknown as PublishViaManusInput;

  if (!data?.imageUrl || !data?.caption || !data?.platform) {
    throw new Error("publishViaManus requires imageUrl, caption, and platform");
  }

  const placement = data.placement ?? "feed";
  if (placement === "story" && data.platform !== "instagram") {
    throw new Error('Instagram Stories require platform: "instagram".');
  }

  if (!/^https?:\/\//i.test(data.imageUrl)) {
    throw new Error(
      "imageUrl must be a publicly accessible http(s) URL — Manus / the social platform cannot fetch private or relative URLs.",
    );
  }

  if (data.platform !== "instagram" && data.platform !== "facebook") {
    throw new Error(
      `Unsupported platform: ${data.platform}. Only "instagram" and "facebook" are wired up.`,
    );
  }

  try {
    return await createAndAwaitTask({ ...data, placement });
  } catch (err) {
    console.error("[manus] publishViaManus error:", err);
    const message = err instanceof Error ? err.message : "Unknown publish error";
    return {
      ok: false,
      error: message,
    } satisfies PublishViaManusResult;
  }
});

/**
 * Scheduled publisher. Walks `products` table for rows where status='scheduled'
 * and scheduled_publish_at <= now(), and publishes each via Manus.
 *
 * Auth: requires header `x-cron-secret` matching CRON_SECRET. Intended to be
 * called by Cloudflare Cron Triggers, GitHub Actions, cron-job.org, etc.
 */
export const runScheduledPublisher = createServerFn({ method: "POST" }).handler(async (ctx) => {
  const data = ctx.data as unknown as { secret?: string } | undefined;

  const expected = process.env.CRON_SECRET;
  if (!expected) {
    throw new Error("CRON_SECRET not configured on the server");
  }
  if (!data?.secret || data.secret !== expected) {
    throw new Error("Invalid cron secret");
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Supabase server credentials not configured (need SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)",
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  const nowIso = new Date().toISOString();

  const { data: due, error: queryError } = await supabase
    .from("products")
    .select("id, name, description, image_url, scheduled_publish_at, status")
    .eq("status", "scheduled")
    .lte("scheduled_publish_at", nowIso)
    .limit(20);

  if (queryError) {
    console.error("[manus cron] query error:", queryError);
    throw new Error(`Supabase query failed: ${queryError.message}`);
  }

  const results: Array<{
    id: string;
    platform: ManusPlatform;
    ok: boolean;
    postUrl?: string;
    error?: string;
  }> = [];

  for (const product of due ?? []) {
    const caption = `Introducing the ${product.name} ✨\n\n${product.description}\n\nAvailable now at Little Luxuries.`;
    const imageUrl = product.image_url;

    if (!imageUrl || !/^https?:\/\//i.test(imageUrl)) {
      results.push({
        id: product.id,
        platform: "instagram",
        ok: false,
        error: "Product image_url is not a public http(s) URL",
      });
      continue;
    }

    // Flip status to 'published' first so we don't re-pick this row on the
    // next cron tick if Manus is slow. If publishing fails, we still log it.
    await supabase.from("products").update({ status: "published" }).eq("id", product.id);

    const igResult = await createAndAwaitTask({
      imageUrl,
      caption,
      platform: "instagram",
      productId: product.id,
    });
    results.push({
      id: product.id,
      platform: "instagram",
      ok: igResult.ok,
      postUrl: igResult.postUrl,
      error: igResult.error,
    });

    if (process.env.MANUS_FB_CONNECTOR_ID) {
      const fbResult = await createAndAwaitTask({
        imageUrl,
        caption,
        platform: "facebook",
        productId: product.id,
      });
      results.push({
        id: product.id,
        platform: "facebook",
        ok: fbResult.ok,
        postUrl: fbResult.postUrl,
        error: fbResult.error,
      });
    }
  }

  return {
    ok: true,
    processed: results.length,
    results,
  };
});
