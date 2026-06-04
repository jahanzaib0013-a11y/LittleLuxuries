import { z } from "zod";
import {
  createPasswordResetLink,
  getAdminEmailForReset,
  resolveAppBaseUrl,
} from "@/lib/admin-auth.server";
import { isAdminEmail } from "@/lib/admin-auth-env.server";
import { buildAdminPasswordResetLinkEmail, EMAIL_LOGO_CID } from "@/lib/email-templates";
import { serverEnv } from "@/lib/server-dotenv.server";

async function loadNodemailer() {
  const mailerPkg = "node" + "mailer";
  const mod = await import(/* @vite-ignore */ mailerPkg);
  return mod.default;
}

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

  const emailUser = serverEnv("EMAIL_USER");
  const emailPass = serverEnv("EMAIL_PASSWORD");

  if (!emailUser || !emailPass) {
    return {
      success: false,
      message: "Server email not configured. Set EMAIL_USER and EMAIL_PASSWORD in .env.",
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

  const nodemailer = await loadNodemailer();
  const transporter = nodemailer.createTransport({
    host: serverEnv("EMAIL_HOST") || "smtp.gmail.com",
    port: parseInt(serverEnv("EMAIL_PORT") || "587", 10),
    secure: serverEnv("EMAIL_SECURE") === "true",
    auth: { user: emailUser, pass: emailPass },
  });

  const safeUrl = resetUrl
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  const fromAddress = serverEnv("EMAIL_FROM")?.trim() || `"Little Luxuries" <${emailUser}>`;
  const { existsSync } = await import(/* @vite-ignore */ "node:fs");
  const { join } = await import(/* @vite-ignore */ "node:path");
  const logoPath = join(process.cwd(), "src/assets/logo.png");
  const logo = existsSync(logoPath)
    ? ({ filename: "logo.png", path: logoPath, cid: EMAIL_LOGO_CID } as const)
    : undefined;

  try {
    await transporter.sendMail({
      from: fromAddress,
      to: email,
      subject: "Little Luxuries — Reset your admin password",
      html: buildAdminPasswordResetLinkEmail(safeUrl),
      attachments: logo ? [logo] : undefined,
    });

    return { success: true, message: "Reset link sent successfully." };
  } catch (error: unknown) {
    const err = error as Error & { code?: string };
    const hint =
      err.code === "EAUTH"
        ? "SMTP authentication failed. Check EMAIL_USER and EMAIL_PASSWORD (use a Gmail app password if needed)."
        : err.message || "Failed to send reset email";
    return { success: false, message: hint };
  }
}
