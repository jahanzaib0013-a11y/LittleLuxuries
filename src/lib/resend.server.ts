/**
 * Resend email sender (HTTP API).
 *
 * Uses fetch so it works on Cloudflare Workers / SSR (nodemailer does not).
 * Configure via env: RESEND_API_KEY (required), RESEND_FROM / EMAIL_FROM
 * (verified sender), ADMIN_EMAIL (where store notifications go), EMAIL_LOGO_URL
 * (optional hosted logo shown in the email header).
 */
import { serverEnv } from "@/lib/server-dotenv.server";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export type ResendResult = { success: boolean; skipped?: boolean; error?: string };

/** Sender address. Must be on a Resend-verified domain in production. */
export function resendFrom(): string {
  return (
    serverEnv("RESEND_FROM")?.trim() ||
    serverEnv("EMAIL_FROM")?.trim() ||
    "Little Luxuries <onboarding@resend.dev>"
  );
}

/** Where internal store notifications (contact form, new subscriber) are sent. */
export function adminNotificationEmail(): string {
  return serverEnv("ADMIN_EMAIL")?.trim() || "jahanzaib0013@gmail.com";
}

/** Optional public logo URL for the email header (Resend can't inline CID images). */
export function emailLogoUrl(): string | undefined {
  return serverEnv("EMAIL_LOGO_URL")?.trim() || undefined;
}

/** True when Resend is configured. */
export function isResendConfigured(): boolean {
  return Boolean(serverEnv("RESEND_API_KEY"));
}

export async function sendEmailViaResend(opts: {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  from?: string;
}): Promise<ResendResult> {
  const apiKey = serverEnv("RESEND_API_KEY");
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set — email not sent.", {
      to: opts.to,
      subject: opts.subject,
    });
    return { success: false, skipped: true };
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: opts.from || resendFrom(),
        to: Array.isArray(opts.to) ? opts.to : [opts.to],
        subject: opts.subject,
        html: opts.html,
        ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[email] Resend error", res.status, text);
      return { success: false, error: `Resend ${res.status}: ${text}` };
    }
    return { success: true };
  } catch (err) {
    const e = err as Error;
    console.error("[email] Resend request failed", e);
    return { success: false, error: e.message || "Resend request failed" };
  }
}
