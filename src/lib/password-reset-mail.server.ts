import { z } from "zod";
import {
  createPasswordResetLink,
  getAdminEmailForReset,
  resolveAppBaseUrl,
} from "@/lib/admin-auth.server";
import { isAdminEmail } from "@/lib/admin-auth-env.server";
import { buildAdminPasswordResetLinkEmail, setEmailLogoUrl } from "@/lib/email-templates";
import { emailLogoUrl, isResendConfigured, sendEmailViaResend } from "@/lib/resend.server";

const passwordResetSchema = z.object({
  email: z.string().email(),
});

export type PasswordResetResult = { success: boolean; message: string };

export async function handleAdminPasswordReset(
  rawEmail: string,
  requestOrigin?: string,
): Promise<PasswordResetResult> {
  const parsed = passwordResetSchema.safeParse({ email: rawEmail });
  if (!parsed.success) {
    return { success: false, message: "Please enter a valid email address." };
  }

  const email = parsed.data.email.trim();

  if (!getAdminEmailForReset()) {
    return {
      success: false,
      message: "Admin email is not configured on the server. Set ADMIN_EMAIL in .env.",
    };
  }

  if (!isAdminEmail(email)) {
    return { success: false, message: "Email not found in system." };
  }

  if (!isResendConfigured()) {
    return {
      success: false,
      message: "Server email not configured. Set RESEND_API_KEY in .env.",
    };
  }

  const baseUrl = resolveAppBaseUrl(requestOrigin);
  let resetUrl: string;
  try {
    resetUrl = await createPasswordResetLink(baseUrl);
  } catch (err) {
    console.error("[forgot-password] token creation failed:", err);
    return {
      success: false,
      message:
        "Could not create a reset link. Set ADMIN_PASSWORD in .env for the first reset, or configure SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  const safeUrl = resetUrl
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  setEmailLogoUrl(emailLogoUrl());

  const result = await sendEmailViaResend({
    to: email,
    subject: "Little Luxuries — Reset your admin password",
    html: buildAdminPasswordResetLinkEmail(safeUrl),
  });

  if (!result.success) {
    return {
      success: false,
      message: result.error || "Failed to send reset email",
    };
  }

  return { success: true, message: "Reset link sent successfully." };
}
