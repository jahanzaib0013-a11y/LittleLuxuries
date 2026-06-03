/**
 * Professional WhatsApp Message Service
 * Handles formatting and deep linking for boutique communications.
 */

export const whatsappService = {
  /**
   * Generates a professional boutique confirmation message
   */
  formatConfirmationMessage(data: {
    customerName: string;
    orderNumber: string;
    items: Array<{ name: string }>;
    trackingUrl: string;
    trackingNumber?: string;
  }): string {
    const { customerName, orderNumber, items, trackingUrl, trackingNumber } = data;

    const header = "🌸 *Little Luxuries Confirmation* 🌸";
    const greeting = `Hello *${customerName}*, we've received your order *#${orderNumber}*!`;

    const itemsList =
      items.length > 0 ? `\n*Items:*\n${items.map((item) => `✨ ${item.name}`).join("\n")}` : "";

    const action = `\n*Please reply with "YES" to confirm your order.*`;

    const tracking = trackingNumber
      ? `\n📍 *Tracking ID:* ${trackingNumber}\n🔗 *Track Link:* ${trackingUrl}`
      : trackingUrl
        ? `\n📍 *Track your order:* ${trackingUrl}`
        : "";

    const footer = `\n---\n_Ethically Crafted Heirlooms_`;

    return `${header}\n\n${greeting}${itemsList}\n${tracking}\n${action}\n\n${footer}`;
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
