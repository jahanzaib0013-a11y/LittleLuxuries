/**
 * One-time migration: compress + resize every image already in the
 * "product-images" Supabase Storage bucket, in place.
 *
 * Why in place: we re-upload to the SAME object path (upsert) with WebP bytes,
 * so every URL already stored in the database keeps working unchanged — only
 * the bytes (and content-type) get smaller. The longest edge is capped and the
 * image is re-encoded to WebP, matching the browser-side compression we now do
 * on new uploads (src/lib/image-service.ts).
 *
 * Usage:
 *   node scripts/compress-existing-images.mjs           # dry run (reports only)
 *   node scripts/compress-existing-images.mjs --apply   # actually re-upload
 *
 * Requires SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY
 * in the environment / .env.
 */
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { readFileSync } from "node:fs";

// --- minimal .env loader (no extra dependency) -----------------------------
try {
  const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
} catch {
  /* no .env file — rely on real env */
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "product-images";
const MAX_EDGE = 1400;
const WEBP_QUALITY = 82;
const APPLY = process.argv.includes("--apply");

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// Recursively list every file in the bucket.
async function listAll(prefix = "") {
  const out = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(prefix, { limit: 100, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw error;
    if (!data.length) break;
    for (const entry of data) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;
      // Folders have no `id` / metadata; recurse into them.
      if (entry.id === null || entry.metadata === null) {
        out.push(...(await listAll(path)));
      } else {
        out.push({ path, size: entry.metadata?.size ?? 0 });
      }
    }
    if (data.length < 100) break;
    offset += data.length;
  }
  return out;
}

const fmt = (n) => `${(n / 1024).toFixed(0)} KiB`;
const COMPRESSIBLE = /\.(jpe?g|png|webp)$/i;

async function main() {
  console.log(`Bucket: ${BUCKET}  |  mode: ${APPLY ? "APPLY (re-uploading)" : "DRY RUN"}`);
  const files = await listAll();
  console.log(`Found ${files.length} objects.\n`);

  let before = 0,
    after = 0,
    changed = 0,
    skipped = 0;

  for (const f of files) {
    if (!COMPRESSIBLE.test(f.path)) {
      skipped++;
      continue;
    }
    const { data, error } = await supabase.storage.from(BUCKET).download(f.path);
    if (error) {
      console.warn(`  ! download failed: ${f.path} (${error.message})`);
      continue;
    }
    const input = Buffer.from(await data.arrayBuffer());
    const meta = await sharp(input).metadata();
    const scale = Math.min(1, MAX_EDGE / Math.max(meta.width ?? 1, meta.height ?? 1));
    const output = await sharp(input)
      .resize({
        width: Math.round((meta.width ?? 0) * scale) || undefined,
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    before += input.length;

    if (output.length >= input.length) {
      // Already small enough — leave it alone.
      after += input.length;
      skipped++;
      console.log(`  = ${f.path}  (${fmt(input.length)}, no gain)`);
      continue;
    }

    after += output.length;
    changed++;
    console.log(
      `  ${APPLY ? "↓" : "·"} ${f.path}  ${fmt(input.length)} → ${fmt(output.length)} ` +
        `(-${(100 - (output.length / input.length) * 100).toFixed(0)}%)`,
    );

    if (APPLY) {
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(f.path, output, {
        upsert: true,
        contentType: "image/webp",
        cacheControl: "31536000",
      });
      if (upErr) console.warn(`    ! upload failed: ${f.path} (${upErr.message})`);
    }
  }

  console.log(
    `\nSummary: ${changed} compressed, ${skipped} skipped.\n` +
      `Total: ${fmt(before)} → ${fmt(after)} ` +
      `(-${before ? (100 - (after / before) * 100).toFixed(0) : 0}%)`,
  );
  if (!APPLY) console.log("\nDry run only. Re-run with --apply to re-upload.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
