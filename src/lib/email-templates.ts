/** Client-safe HTML email builders (no Node built-ins). */

export const EMAIL_LOGO_CID = "logo";

/**
 * Optional hosted logo URL for the email header. Set by the server before
 * building an email (Resend can't inline CID attachments). When empty, the
 * header falls back to the "Little Luxuries" text wordmark.
 */
let emailLogoUrl = "";
export function setEmailLogoUrl(url?: string | null) {
  emailLogoUrl = (url || "").trim();
}

export function formatEmailTimestamp(date = new Date()) {
  return `${date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })} at ${date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
}

export type LittleLuxuriesEmailOptions = {
  documentTitle: string;
  eyebrow: string;
  headline: string;
  bodyHtml: string;
};

/** Branded shell used across Little Luxuries transactional emails (matches contact form design). */
export function wrapLittleLuxuriesEmail(options: LittleLuxuriesEmailOptions): string {
  const { documentTitle, eyebrow, headline, bodyHtml } = options;
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${documentTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8f7fa; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center" style="padding: 60px 20px;">
        <table width="560" cellpadding="0" cellspacing="0" role="presentation" style="background: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);">
          <tr>
            <td align="center" style="padding: 40px 40px 30px; background: #faf9fc; border-radius: 16px 16px 0 0;">
              ${emailLogoUrl ? `<img src="${emailLogoUrl}" alt="Little Luxuries" width="64" height="64" style="margin: 0 auto 16px; border-radius: 50%; display: block; object-fit: cover;" />` : ""}
              <h1 style="margin: 0; font-size: 22px; font-weight: 600; color: #5b21b6; letter-spacing: 0.5px;">Little Luxuries</h1>
              <p style="margin: 6px 0 0; font-size: 12px; color: #7c3aed; letter-spacing: 2px; text-transform: uppercase;">Curated Elegance</p>
            </td>
          </tr>
          <tr>
            <td style="height: 3px; background: linear-gradient(90deg, #fbbf24 0%, #f59e0b 50%, #fbbf24 100%);"></td>
          </tr>
          <tr>
            <td style="padding: 36px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="padding-bottom: 28px;">
                    <p style="margin: 0; font-size: 13px; color: #7c3aed; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">${eyebrow}</p>
                    <h2 style="margin: 8px 0 0; font-size: 20px; font-weight: 600; color: #1f2937; font-family: 'Noto Serif', Georgia, serif;">${headline}</h2>
                  </td>
                </tr>
                ${bodyHtml}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background: #faf9fc; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0 0 4px; font-size: 13px; color: #5b21b6; font-weight: 600; letter-spacing: 0.5px;">Little Luxuries</p>
              <p style="margin: 0 0 8px; font-size: 12px; color: #6b7280;">Ethically crafted baby garments</p>
              <p style="margin: 0; font-size: 11px; color: #9ca3af;">${formatEmailTimestamp()}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function emailInfoCard(rowsHtml: string): string {
  return `<tr>
    <td style="padding-bottom: 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background: #faf9fc; border-radius: 12px; border: 1px solid #e9d5ff;">
        <tr>
          <td style="padding: 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              ${rowsHtml}
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

export function emailInfoRow(label: string, valueHtml: string, isLast = false): string {
  return `<tr>
    <td style="${isLast ? "" : "padding-bottom: 16px;"}">
      <p style="margin: 0 0 4px; font-size: 11px; color: #7c3aed; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">${label}</p>
      <p style="margin: 0; font-size: 15px; color: #4b5563;">${valueHtml}</p>
    </td>
  </tr>`;
}

export function emailHighlightPanel(contentHtml: string): string {
  return `<tr>
    <td style="padding-bottom: 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background: #faf9fc; border-radius: 12px; border-left: 3px solid #fbbf24;">
        <tr>
          <td style="padding: 20px 24px;">
            ${contentHtml}
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

export function emailParagraph(text: string): string {
  return `<tr>
    <td style="padding-bottom: 20px;">
      <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #4b5563;">${text}</p>
    </td>
  </tr>`;
}

export function emailCtaButton(label: string, href: string): string {
  return `<tr>
    <td style="padding-bottom: 24px;">
      <table cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td align="center" style="border-radius: 999px; background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);">
            <a href="${href}" style="display: inline-block; padding: 14px 32px; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; letter-spacing: 0.5px;">${label}</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

/** Wrap an admin-composed plain-text message into the branded email shell. */
export function wrapPlainTextEmail(subject: string, bodyText: string): string {
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const paragraphs = bodyText
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => emailParagraph(escape(p).replace(/\n/g, "<br/>")))
    .join("");
  const title = subject.trim() || "A note from Little Luxuries";
  return wrapLittleLuxuriesEmail({
    documentTitle: title,
    eyebrow: "A note for you",
    headline: title,
    bodyHtml: paragraphs,
  });
}

export function buildAdminPasswordResetLinkEmail(safeResetUrl: string): string {
  const bodyHtml = [
    emailParagraph(
      'You requested a password reset for the <strong style="color: #1f2937;">Little Luxuries Admin Portal</strong>. Click the button below to choose a new password. This link expires in one hour.',
    ),
    emailCtaButton("Reset admin password", safeResetUrl),
    emailHighlightPanel(
      `<p style="margin: 0 0 8px; font-size: 11px; color: #7c3aed; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Security reminder</p>
       <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #374151;">We never send your password by email. If you did not request this reset, ignore this message.</p>`,
    ),
  ].join("");

  return wrapLittleLuxuriesEmail({
    documentTitle: "Reset Admin Password — Little Luxuries",
    eyebrow: "Admin Portal",
    headline: "Reset your password",
    bodyHtml,
  });
}

export type OrderStatusEmailInput = {
  customerName: string;
  orderNumber: string;
  title: string;
  message: string;
  icon: string;
  trackingNumber?: string;
};

export function buildOrderStatusEmail(input: OrderStatusEmailInput): string {
  const trackingBlock = input.trackingNumber
    ? emailInfoCard(
        emailInfoRow(
          "Tracking number",
          `<span style="font-size: 18px; font-weight: 600; color: #1f2937;">${input.trackingNumber}</span>`,
          true,
        ),
      )
    : "";

  const bodyHtml = [
    emailParagraph(`Hello ${input.customerName},`),
    emailParagraph(input.message),
    trackingBlock,
    emailParagraph("Thank you for choosing Little Luxuries for your little one."),
    `<tr>
      <td>
        <p style="margin: 0; font-size: 15px; color: #1f2937; font-weight: 600;">Warmly,<br>The Little Luxuries Team</p>
      </td>
    </tr>`,
  ].join("");

  return wrapLittleLuxuriesEmail({
    documentTitle: `${input.title} — Little Luxuries`,
    eyebrow: `Order #${input.orderNumber}`,
    headline: `${input.icon} ${input.title}`,
    bodyHtml,
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type ContactFormEmailInput = {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
};

export function buildContactFormEmail(input: ContactFormEmailInput): string {
  const safeMessage = escapeHtml(input.message);
  const bodyHtml = [
    emailInfoCard(
      [
        emailInfoRow(
          "Name",
          `<span style="font-size: 16px; color: #1f2937; font-weight: 500;">${escapeHtml(input.firstName)} ${escapeHtml(input.lastName)}</span>`,
          false,
        ),
        emailInfoRow(
          "Email",
          `<a href="mailto:${escapeHtml(input.email)}" style="color: #7c3aed; text-decoration: none;">${escapeHtml(input.email)}</a>`,
          false,
        ),
        emailInfoRow("Subject", escapeHtml(input.subject || "General Inquiry"), true),
      ].join(""),
    ),
    `<tr>
      <td style="padding-bottom: 28px;">
        <p style="margin: 0 0 10px; font-size: 11px; color: #7c3aed; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Message</p>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background: #faf9fc; border-radius: 12px; border-left: 3px solid #fbbf24;">
          <tr>
            <td style="padding: 20px 24px;">
              <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #374151; white-space: pre-wrap;">${safeMessage}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`,
  ].join("");

  return wrapLittleLuxuriesEmail({
    documentTitle: "New Contact Form — Little Luxuries",
    eyebrow: "New Contact Message",
    headline: "You've received a new inquiry",
    bodyHtml,
  });
}

export function buildNewsletterWelcomeEmail(): string {
  const bodyHtml = [
    emailParagraph(
      "Thank you for joining the Little Luxuries circle. We are delighted to welcome you to our community of families who cherish thoughtfully made baby garments.",
    ),
    emailInfoCard(
      [
        emailInfoRow("Welcome offer", "10% off your first order", false),
        emailInfoRow(
          "Your code",
          `<span style="font-size: 22px; font-weight: 700; letter-spacing: 3px; color: #1f2937;">CIRCLE10</span>`,
          true,
        ),
      ].join(""),
    ),
    emailHighlightPanel(
      `<p style="margin: 0; font-size: 14px; line-height: 1.6; color: #374151;">Enter <strong>CIRCLE10</strong> at checkout. Valid for first-time purchases only.</p>`,
    ),
    emailParagraph("We look forward to dressing your little one in heirloom-quality pieces."),
  ].join("");

  return wrapLittleLuxuriesEmail({
    documentTitle: "Welcome to the Circle — Little Luxuries",
    eyebrow: "Newsletter",
    headline: "Welcome to the Circle",
    bodyHtml,
  });
}
