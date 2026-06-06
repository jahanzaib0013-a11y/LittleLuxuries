/**
 * Professional WhatsApp Message Service
 * Handles tier-aware message composition and deep linking for boutique
 * communications. All WhatsApp text in the app is built here so tone stays
 * consistent and graded by the customer's loyalty tier.
 */
import { formatPkr } from "@/lib/format-currency";

export type CustomerTier = "Standard" | "Bronze" | "Silver" | "Gold" | "Platinum";

type TierVoice = {
  emoji: string;
  /** Adjective used in the greeting, e.g. "valued Gold member". */
  warmth: string;
  /** Closing sign-off line. */
  signoff: string;
};

/**
 * The voice for each tier. Standard stays plain and simple; warmth escalates
 * up to Platinum. `emoji` empty for Standard (no badge in greeting).
 */
const TIER_VOICE: Record<CustomerTier, TierVoice> = {
  Standard: {
    emoji: "",
    warmth: "",
    signoff: "— Little Luxuries",
  },
  Bronze: {
    emoji: "🥉",
    warmth: "Bronze member",
    signoff: "Thank you for being part of the family,\n— Little Luxuries",
  },
  Silver: {
    emoji: "🥈",
    warmth: "valued Silver member",
    signoff: "Always a pleasure to serve you,\n— Little Luxuries",
  },
  Gold: {
    emoji: "🥇",
    warmth: "distinguished Gold member",
    signoff: "With our warmest regards,\n— The Little Luxuries Team",
  },
  Platinum: {
    emoji: "💎",
    warmth: "esteemed Platinum member",
    signoff: "Your dedicated concierge,\n— The Little Luxuries Team",
  },
};

/** Normalize loose tier values ("silver", "Gold Member") to a CustomerTier. */
export function normalizeTier(tier?: string | null): CustomerTier {
  const t = (tier ?? "").toLowerCase().replace(" member", "").trim();
  switch (t) {
    case "bronze":
      return "Bronze";
    case "silver":
      return "Silver";
    case "gold":
      return "Gold";
    case "platinum":
      return "Platinum";
    default:
      return "Standard";
  }
}

/** A greeting line that acknowledges the badge for non-Standard tiers. */
export function tierGreeting(customerName: string, tier?: string | null): string {
  const t = normalizeTier(tier);
  const voice = TIER_VOICE[t];
  if (t === "Standard") return `Hello ${customerName},`;
  return `Hello ${customerName} — our ${voice.warmth} ${voice.emoji},`.replace(/\s+,/, ",");
}

/** The tier-graded sign-off block. */
export function tierSignoff(tier?: string | null): string {
  return TIER_VOICE[normalizeTier(tier)].signoff;
}

export const whatsappService = {
  /**
   * Order confirmation prefill — tier-graded greeting, items with quantity,
   * and the order total.
   */
  formatConfirmationMessage(data: {
    customerName: string;
    orderNumber: string;
    items: Array<{ name: string; quantity?: number }>;
    total?: number;
    tier?: string | null;
  }): string {
    const { customerName, orderNumber, items, total, tier } = data;

    const header = "🌸 *Little Luxuries* 🌸";
    const greeting = tierGreeting(customerName, tier);
    const intro = `We've received your order *#${orderNumber}* — thank you!`;

    const itemsList =
      items.length > 0
        ? `\n\n*Your items:*\n${items
            .map(
              (item) =>
                `✨ *${item.quantity && item.quantity > 1 ? `${item.quantity} ×` : "1 ×"}* ${item.name}`,
            )
            .join("\n")}`
        : "";

    const totalLine =
      typeof total === "number" && !Number.isNaN(total) ? `\n\n*Total:* ${formatPkr(total)}` : "";

    const footer = `\n\n${tierSignoff(tier)}`;

    return `${header}\n\n${greeting}\n${intro}${itemsList}${totalLine}${footer}`;
  },

  /**
   * Order status-update message — tier-graded.
   */
  formatStatusUpdateMessage(data: {
    customerName: string;
    orderNumber: string;
    status: string;
    tier?: string | null;
  }): string {
    const { customerName, orderNumber, status, tier } = data;
    const t = normalizeTier(tier);

    const greeting = tierGreeting(customerName, tier);
    const line = `Your order *#${orderNumber}* is now *${status}*.`;

    const tierNote: Record<CustomerTier, string> = {
      Standard: "Thank you for shopping with us.",
      Bronze: "We appreciate your continued support.",
      Silver:
        "Thank you for being a valued part of our boutique — we're here for anything you need.",
      Gold: "As a Gold member, your order is handled with our priority care.",
      Platinum: "As a Platinum member, your order receives our highest, white-glove attention.",
    };

    return `${greeting}\n${line}\n\n${tierNote[t]}\n\n${tierSignoff(tier)}`;
  },

  /**
   * Generic account/relationship message for the customer list & profile.
   */
  formatAccountMessage(data: { customerName: string; tier?: string | null }): string {
    const { customerName, tier } = data;
    return `${tierGreeting(customerName, tier)}\nThis is Little Luxuries reaching out regarding your account. How may we help you today?\n\n${tierSignoff(tier)}`;
  },

  /**
   * Cleans and formats a phone number for the WhatsApp API
   */
  formatPhoneForWhatsApp(phone: string): string {
    let cleaned = phone.replace(/\D/g, "");

    // Handle Pakistan local format (03xx -> 923xx)
    if (cleaned.startsWith("03") && cleaned.length === 11) {
      cleaned = "92" + cleaned.substring(1);
    }

    return cleaned;
  },

  /**
   * Generates the direct WhatsApp API link
   */
  getWhatsAppLink(phone: string, message: string): string {
    const formattedPhone = this.formatPhoneForWhatsApp(phone);
    return `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(
      message,
    )}`;
  },
};
