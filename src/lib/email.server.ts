import { createServerFn } from "@tanstack/react-start";
import {
  buildContactFormEmail,
  buildNewsletterWelcomeEmail,
  buildOrderStatusEmail,
  setEmailLogoUrl,
  wrapPlainTextEmail,
} from "@/lib/email-templates";
import {
  adminNotificationEmail,
  emailLogoUrl,
  isResendConfigured,
  resendFrom,
  sendEmailViaResend,
} from "@/lib/resend.server";

export interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
}

/** Order statuses that have a customer-facing email (COD-correct, non-contradicting). */
export type OrderEmailStatus =
  | "order_placed"
  | "order_confirmed"
  | "packed"
  | "shipped"
  | "delivered"
  | "payment_confirmed"
  | "cancelled";

type OrderEmailConfig = { title: string; message: string; icon: string };

/** Single source of truth for transactional order emails. One entry per lifecycle step. */
export const ORDER_EMAIL_CONFIG: Record<OrderEmailStatus, OrderEmailConfig> = {
  order_placed: {
    title: "Your Order is Placed!",
    message:
      "Welcome to Little Luxuries! We've received your order and our team is currently reviewing it. We'll notify you as soon as it's confirmed.",
    icon: "🌸",
  },
  order_confirmed: {
    title: "Your order is confirmed!",
    message:
      "Lovely news — your order has been confirmed and our team is now lovingly preparing your pieces. We'll let you know the moment it's packed.",
    icon: "✨",
  },
  packed: {
    title: "Your order is packed!",
    message:
      "Exciting news! We've carefully wrapped and packed your heirloom pieces. They are now ready for the next step of their journey.",
    icon: "📦",
  },
  shipped: {
    title: "Your order is on its way!",
    message:
      "Your Little Luxuries package has been shipped! It's currently traveling to you with the utmost care.",
    icon: "🚚",
  },
  delivered: {
    title: "Your order has been delivered!",
    message:
      "Warmest wishes! Your package has arrived. We hope these pieces bring joy and comfort to your little one.",
    icon: "🎁",
  },
  payment_confirmed: {
    title: "Payment received — order complete!",
    message:
      "Thank you! We've received your payment and your order is now complete. It was a joy to serve you — we hope you treasure your Little Luxuries pieces.",
    icon: "💖",
  },
  cancelled: {
    title: "Your order has been cancelled",
    message:
      "Your order has been cancelled. If this wasn't expected or you have any questions, simply reply to this email and our team will be glad to help.",
    icon: "🕊️",
  },
};

export const sendContactEmail = createServerFn({ method: "POST" }).handler(async (ctx) => {
  const data = ctx.data as unknown as ContactFormData;

  if (!data) {
    throw new Error("No data received");
  }

  const { firstName, lastName, email, subject, message } = data;

  if (!firstName || !lastName || !email || !message) {
    throw new Error("Missing required fields");
  }

  setEmailLogoUrl(emailLogoUrl());
  const admin = adminNotificationEmail();

  if (!isResendConfigured()) {
    console.warn("Resend not configured, logging contact form to console instead");
    console.log("================ CONTACT FORM =================");
    console.log(`From: ${firstName} ${lastName} <${email}>`);
    console.log(`Subject: ${subject || "No subject"}`);
    console.log(`Message: ${message}`);
    console.log(`To: ${admin}`);
    console.log("===============================================");
    return {
      success: true,
      message: "Contact form submitted (email logged to console — RESEND_API_KEY not set)",
    };
  }

  const result = await sendEmailViaResend({
    to: admin,
    replyTo: email,
    subject: `Little Luxuries Contact: ${subject || "New Message"}`,
    html: buildContactFormEmail({ firstName, lastName, email, subject, message }),
  });

  if (!result.success) {
    throw new Error(`Failed to send email: ${result.error || "Unknown error"}`);
  }

  return { success: true, message: `Email sent successfully to ${admin}` };
});

export const subscribeToNewsletter = createServerFn({ method: "POST" }).handler(
  async (ctx: unknown) => {
    const { data } = ctx as { data: { email: string } };
    const { email } = data;

    setEmailLogoUrl(emailLogoUrl());

    if (!isResendConfigured()) {
      console.warn("Resend not configured. Simulated subscription for:", email);
      return { success: true, message: "Subscribed successfully (simulated)" };
    }

    const welcome = await sendEmailViaResend({
      to: email,
      subject: "Welcome to the Circle (Plus 10% Off!)",
      html: buildNewsletterWelcomeEmail(),
    });

    if (!welcome.success) {
      throw new Error("Failed to subscribe");
    }

    // Notify admin (best-effort).
    await sendEmailViaResend({
      to: adminNotificationEmail(),
      subject: "New Newsletter Subscriber",
      html: `<p>A new user just subscribed to the newsletter: <strong>${email}</strong></p>`,
    });

    return { success: true };
  },
);

export const sendOrderStatusEmail = createServerFn({ method: "POST" }).handler(
  async (ctx: unknown) => {
    const { data } = ctx as {
      data: {
        orderNumber: string;
        customerEmail: string;
        customerName: string;
        status: OrderEmailStatus;
        trackingNumber?: string;
      };
    };
    const { orderNumber, customerEmail, customerName, status, trackingNumber } = data;

    setEmailLogoUrl(emailLogoUrl());

    const config = ORDER_EMAIL_CONFIG[status];
    if (!config) {
      // No customer email defined for this status (e.g. pending_payment, paid,
      // payment_initiated, refunded) — nothing to send.
      return { success: true, message: `No email for status "${status}"` };
    }

    if (!isResendConfigured()) {
      console.warn("Resend not configured. Order status update logged to console.");
      console.log(`[ORDER EMAIL] To: ${customerEmail}, Order: ${orderNumber}, Status: ${status}`);
      return { success: true, message: "Logged to console (RESEND_API_KEY not set)" };
    }

    const result = await sendEmailViaResend({
      to: customerEmail,
      from: resendFrom(),
      subject: `${config.title} (Order #${orderNumber})`,
      html: buildOrderStatusEmail({
        customerName,
        orderNumber,
        title: config.title,
        message: config.message,
        icon: config.icon,
        trackingNumber,
      }),
    });

    if (!result.success) {
      throw new Error("Failed to send status update email");
    }
    return { success: true };
  },
);

/**
 * Admin-composed email (Email Writer). Wraps the edited body in the branded
 * shell and sends via Resend. Exported as a plain createServerFn (no cast) so
 * the client→server RPC transform works.
 */
export const sendCustomEmail = createServerFn({ method: "POST" }).handler(async (ctx: unknown) => {
  const { data } = ctx as {
    data: { to: string; subject: string; body: string; replyTo?: string };
  };
  const { to, subject, body, replyTo } = data;

  if (!to || !body?.trim()) {
    throw new Error("Recipient and message are required");
  }

  setEmailLogoUrl(emailLogoUrl());

  if (!isResendConfigured()) {
    console.warn("Resend not configured. Custom email logged to console.");
    console.log(`[CUSTOM EMAIL] To: ${to} | Subject: ${subject}\n${body}`);
    return { success: true, message: "Logged to console (RESEND_API_KEY not set)" };
  }

  const result = await sendEmailViaResend({
    to,
    replyTo,
    subject: subject.trim() || "A note from Little Luxuries",
    html: wrapPlainTextEmail(subject, body),
  });

  if (!result.success) {
    throw new Error(result.error || "Failed to send email");
  }
  return { success: true };
});
