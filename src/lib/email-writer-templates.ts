/**
 * Email Writer templates. Each template builds a full Subject + Message for the
 * admin to send, automatically toned to the customer's loyalty badge (tone
 * only — no money-affecting perks). Reuses the tier voice from the WhatsApp
 * service so greetings/sign-offs stay consistent across channels.
 */
import { tierGreeting, tierSignoff } from "@/lib/whatsapp-service";

export type EmailTemplateCategory = "Status" | "General";

export type EmailWriterContext = {
  customerName: string;
  orderNumber: string;
  status?: string;
  trackingNumber?: string | null;
  tier?: string | null;
};

export type EmailTemplate = {
  id: string;
  label: string;
  category: EmailTemplateCategory;
  /** Builds the editable subject + body, toned to ctx.tier. */
  build: (ctx: EmailWriterContext) => { subject: string; body: string };
};

/** Helper: greeting + body lines + sign-off, all tier-toned. */
function compose(ctx: EmailWriterContext, lines: string[]): string {
  return `${tierGreeting(ctx.customerName, ctx.tier)}\n\n${lines.join("\n\n")}\n\n${tierSignoff(ctx.tier)}`;
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  // ---- Status ----
  {
    id: "order_confirmed",
    label: "Order Confirmed",
    category: "Status",
    build: (c) => ({
      subject: `Your order is confirmed — #${c.orderNumber}`,
      body: compose(c, [
        `Wonderful news — your order #${c.orderNumber} has been confirmed and our team is now lovingly preparing your pieces.`,
        `We'll let you know the moment it's packed and on its way.`,
      ]),
    }),
  },
  {
    id: "packed",
    label: "Packed",
    category: "Status",
    build: (c) => ({
      subject: `Your order is packed — #${c.orderNumber}`,
      body: compose(c, [
        `Your order #${c.orderNumber} has been carefully wrapped and packed. It's ready for the next step of its journey to you.`,
      ]),
    }),
  },
  {
    id: "shipped",
    label: "Shipped",
    category: "Status",
    build: (c) => ({
      subject: `Your order is on its way — #${c.orderNumber}`,
      body: compose(c, [
        `Exciting update — your order #${c.orderNumber} has shipped and is travelling to you with care.`,
        c.trackingNumber
          ? `Tracking number: ${c.trackingNumber}`
          : `We'll share tracking details shortly.`,
      ]),
    }),
  },
  {
    id: "delivered",
    label: "Delivered",
    category: "Status",
    build: (c) => ({
      subject: `Your order has arrived — #${c.orderNumber}`,
      body: compose(c, [
        `Your order #${c.orderNumber} has been delivered. We hope these pieces bring joy and comfort to your little one.`,
        `If anything isn't quite right, simply reply to this message — we're always here to help.`,
      ]),
    }),
  },
  {
    id: "payment_received",
    label: "Payment Received",
    category: "Status",
    build: (c) => ({
      subject: `Payment received — order #${c.orderNumber} complete`,
      body: compose(c, [
        `Thank you! We've received your payment and your order #${c.orderNumber} is now complete.`,
        `It was a joy to serve you — we hope you treasure your Little Luxuries pieces.`,
      ]),
    }),
  },
  {
    id: "cancelled",
    label: "Cancelled",
    category: "Status",
    build: (c) => ({
      subject: `Your order has been cancelled — #${c.orderNumber}`,
      body: compose(c, [
        `Your order #${c.orderNumber} has been cancelled.`,
        `If this wasn't expected, or you'd like help placing a new order, just reply and we will be glad to assist.`,
      ]),
    }),
  },
  {
    id: "refund_processed",
    label: "Refund Processed",
    category: "Status",
    build: (c) => ({
      subject: `Your refund is on its way — #${c.orderNumber}`,
      body: compose(c, [
        `We've processed the refund for your order #${c.orderNumber}. Depending on your bank, it may take a few business days to appear.`,
        `Thank you for your patience and understanding.`,
      ]),
    }),
  },

  // ---- General ----
  {
    id: "thank_you",
    label: "Thank You / Loyalty",
    category: "General",
    build: (c) => ({
      subject: `A heartfelt thank you from Little Luxuries`,
      body: compose(c, [
        `We just wanted to say thank you for choosing Little Luxuries. It means the world to our small team.`,
        `We're always here if there's anything we can do for you and your little one.`,
      ]),
    }),
  },
  {
    id: "review_request",
    label: "Review Request",
    category: "General",
    build: (c) => ({
      subject: `How did we do? — order #${c.orderNumber}`,
      body: compose(c, [
        `We'd love to hear how you're getting on with your recent order #${c.orderNumber}.`,
        `If you have a moment, a short review would mean a great deal and helps other families discover us.`,
      ]),
    }),
  },
  {
    id: "special_offer",
    label: "Special Offer",
    category: "General",
    build: (c) => ({
      subject: `A little something, just for you`,
      body: compose(c, [
        `As a thank you for being part of the Little Luxuries family, we'd love to treat you on your next order.`,
        `[Add your offer details here before sending.]`,
      ]),
    }),
  },
  {
    id: "re_engagement",
    label: "We Miss You",
    category: "General",
    build: (c) => ({
      subject: `We've missed you at Little Luxuries`,
      body: compose(c, [
        `It's been a little while since your last visit and we wanted to say hello.`,
        `We've added some lovely new pieces we think you'll adore — do pop by when you have a moment.`,
      ]),
    }),
  },
  {
    id: "delay_apology",
    label: "Delay Apology",
    category: "General",
    build: (c) => ({
      subject: `A quick update on your order — #${c.orderNumber}`,
      body: compose(c, [
        `We wanted to personally let you know your order #${c.orderNumber} is taking a little longer than usual, and we're sorry for the wait.`,
        `Rest assured it's a priority for us, and we'll update you the moment it moves.`,
      ]),
    }),
  },
  {
    id: "care_instructions",
    label: "Care Instructions",
    category: "General",
    build: (c) => ({
      subject: `Caring for your Little Luxuries pieces`,
      body: compose(c, [
        `To keep your pieces soft and beautiful for years to come, we recommend a gentle cold wash and laying flat to dry.`,
        `Avoid harsh detergents and tumble drying to preserve the natural fibres.`,
      ]),
    }),
  },
  {
    id: "welcome",
    label: "Welcome",
    category: "General",
    build: (c) => ({
      subject: `Welcome to Little Luxuries`,
      body: compose(c, [
        `Welcome to Little Luxuries — we're so happy to have you with us.`,
        `Every piece we make is crafted with love and the gentlest materials for your little one. We can't wait to be part of your story.`,
      ]),
    }),
  },
  {
    id: "feedback_survey",
    label: "Feedback Survey",
    category: "General",
    build: (c) => ({
      subject: `We'd love your thoughts`,
      body: compose(c, [
        `We're always trying to make Little Luxuries better, and your opinion matters to us.`,
        `If you have a moment, we'd be grateful to hear your feedback — just reply and let us know.`,
      ]),
    }),
  },
  {
    id: "new_arrival",
    label: "New Arrival",
    category: "General",
    build: (c) => ({
      subject: `Something new has arrived at Little Luxuries`,
      body: compose(c, [
        `We've just welcomed some beautiful new arrivals we thought you'd love.`,
        `[Add the product highlight or link here before sending.]`,
      ]),
    }),
  },
  {
    id: "custom",
    label: "Custom (blank)",
    category: "General",
    build: (c) => ({
      subject: ``,
      body: compose(c, [`[Write your message here.]`]),
    }),
  },
];

/** Map an order status to the most relevant template id (for auto-selection). */
export function pickDefaultTemplateForStatus(status?: string): string {
  switch (status) {
    case "order_confirmed":
      return "order_confirmed";
    case "packed":
      return "packed";
    case "shipped":
      return "shipped";
    case "delivered":
      return "delivered";
    case "payment_confirmed":
      return "payment_received";
    case "cancelled":
      return "cancelled";
    case "refunded":
      return "refund_processed";
    default:
      return "thank_you";
  }
}

export function getEmailTemplate(id: string): EmailTemplate | undefined {
  return EMAIL_TEMPLATES.find((t) => t.id === id);
}
