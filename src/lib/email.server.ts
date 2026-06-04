import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  buildContactFormEmail,
  buildNewsletterWelcomeEmail,
  buildOrderStatusEmail,
  EMAIL_LOGO_CID,
} from "@/lib/email-templates";

async function loadLogoAttachment() {
  const { existsSync } = await import(/* @vite-ignore */ "node:fs");
  const { join } = await import(/* @vite-ignore */ "node:path");
  const logoPath = join(process.cwd(), "src/assets/logo.png");
  if (!existsSync(logoPath)) return undefined;
  return {
    filename: "logo.png",
    path: logoPath,
    cid: EMAIL_LOGO_CID,
  } as const;
}
import { serverEnv } from "@/lib/server-dotenv.server";

/** Vite SSR-safe nodemailer load (direct `import("nodemailer")` can throw at runtime). */
async function loadNodemailer() {
  const mailerPkg = "node" + "mailer";
  const mod = await import(/* @vite-ignore */ mailerPkg);
  return mod.default;
}

export interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
}

export const sendContactEmail = createServerFn({ method: "POST" }).handler(async (ctx) => {
  const mailerPkg = "node" + "mailer";
  const nodemailer = await import(/* @vite-ignore */ mailerPkg);
  const data = ctx.data as unknown as ContactFormData;
  console.log("Server function called with data:", data);

  if (!data) {
    throw new Error("No data received");
  }

  const { firstName, lastName, email, subject, message } = data;

  // Validate required fields
  if (!firstName || !lastName || !email || !message) {
    throw new Error("Missing required fields");
  }

  // Check for email credentials
  const emailUser = serverEnv("EMAIL_USER");
  const emailPass = serverEnv("EMAIL_PASSWORD");

  console.log("Email config:", {
    host: serverEnv("EMAIL_HOST") || "smtp.gmail.com",
    port: serverEnv("EMAIL_PORT") || "587",
    user: emailUser ? "set" : "NOT SET",
    pass: emailPass ? "set" : "NOT SET",
  });

  if (!emailUser || !emailPass) {
    console.warn("Email credentials not configured, logging to console instead");
    console.log("================ CONTACT FORM =================");
    console.log(`From: ${firstName} ${lastName} <${email}>`);
    console.log(`Subject: ${subject || "No subject"}`);
    console.log(`Message: ${message}`);
    console.log(`To: jahanzaib0013@gmail.com`);
    console.log("===============================================");

    return {
      success: true,
      message: "Contact form submitted (email logged to console - credentials not configured)",
    };
  }

  // Configure nodemailer transporter
  const transporter = nodemailer.default.createTransport({
    host: serverEnv("EMAIL_HOST") || "smtp.gmail.com",
    port: parseInt(serverEnv("EMAIL_PORT") || "587", 10),
    secure: serverEnv("EMAIL_SECURE") === "true",
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  const logo = await loadLogoAttachment();

  try {
    // Verify transporter connection
    await transporter.verify();
    console.log("Transporter verified successfully");

    const info = await transporter.sendMail({
      from: emailUser,
      to: "jahanzaib0013@gmail.com",
      replyTo: email,
      subject: `Little Luxuries Contact: ${subject || "New Message"}`,
      text: `New message from ${firstName} ${lastName} (${email}): ${message}`,
      html: buildContactFormEmail({ firstName, lastName, email, subject, message }),
      attachments: logo ? [logo] : undefined,
    });

    console.log("Email sent successfully:", info.messageId);

    return { success: true, message: "Email sent successfully to jahanzaib0013@gmail.com" };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Error sending email:", err);
    throw new Error(`Failed to send email: ${err?.message || "Unknown error"}`);
  }
});

export const subscribeToNewsletter = createServerFn({ method: "POST" }).handler(
  async (ctx: unknown) => {
    const { data } = ctx as { data: { email: string } };
    const { email } = data;
    const emailUser = serverEnv("EMAIL_USER");
    const emailPass = serverEnv("EMAIL_PASSWORD");

    if (!emailUser || !emailPass) {
      console.warn("Email credentials not configured. Simulated subscription for:", email);
      return { success: true, message: "Subscribed successfully (simulated)" };
    }

    const nodemailer = await loadNodemailer();
    const transporter = nodemailer.createTransport({
      host: serverEnv("EMAIL_HOST") || "smtp.gmail.com",
      port: parseInt(serverEnv("EMAIL_PORT") || "587", 10),
      secure: serverEnv("EMAIL_SECURE") === "true",
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    const logo = await loadLogoAttachment();

    try {
      await transporter.sendMail({
        from: `"Little Luxuries" <${emailUser}>`,
        to: email,
        subject: "Welcome to the Circle (Plus 10% Off!)",
        html: buildNewsletterWelcomeEmail(),
        attachments: logo ? [logo] : undefined,
      });

      // Notify admin
      await transporter.sendMail({
        from: emailUser,
        to: "jahanzaib0013@gmail.com",
        subject: "New Newsletter Subscriber",
        text: `A new user just subscribed to the newsletter: ${email}`,
      });

      return { success: true };
    } catch (error: unknown) {
      const err = error as Error;
      console.error("Error sending subscription emails:", err);
      throw new Error("Failed to subscribe");
    }
  },
) as unknown as (payload: {
  data: { email: string };
}) => Promise<{ success: boolean; message?: string }>;

export const sendOrderStatusEmail = createServerFn({ method: "POST" }).handler(
  async (ctx: unknown) => {
    const { data } = ctx as {
      data: {
        orderNumber: string;
        customerEmail: string;
        customerName: string;
        status: "packed" | "shipped" | "delivered" | "paid" | "order_placed";
        trackingNumber?: string;
      };
    };
    const { orderNumber, customerEmail, customerName, status, trackingNumber } = data;
    const emailUser = serverEnv("EMAIL_USER");
    const emailPass = serverEnv("EMAIL_PASSWORD");

    if (!emailUser || !emailPass) {
      console.warn("Email credentials not configured. Order status update logged to console.");
      console.log(`[ORDER EMAIL] To: ${customerEmail}, Order: ${orderNumber}, Status: ${status}`);
      return { success: true, message: "Logged to console (credentials not set)" };
    }

    const nodemailer = await loadNodemailer();
    const transporter = nodemailer.createTransport({
      host: serverEnv("EMAIL_HOST") || "smtp.gmail.com",
      port: parseInt(serverEnv("EMAIL_PORT") || "587", 10),
      secure: serverEnv("EMAIL_SECURE") === "true",
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    const statusConfig = {
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
      paid: {
        title: "Payment Received!",
        message:
          "Thank you! We've successfully verified your payment. Our boutique team is now preparing your order for curation and packing.",
        icon: "✨",
      },
      order_placed: {
        title: "Your Order is Placed!",
        message:
          "Welcome to Little Luxuries! We've received your order and our team is currently reviewing it. We'll notify you as soon as it's confirmed.",
        icon: "🌸",
      },
    };

    const config = statusConfig[status];
    const logo = await loadLogoAttachment();

    try {
      await transporter.sendMail({
        from: `"Little Luxuries" <${emailUser}>`,
        to: customerEmail,
        subject: `${config.title} (Order #${orderNumber})`,
        html: buildOrderStatusEmail({
          customerName,
          orderNumber,
          title: config.title,
          message: config.message,
          icon: config.icon,
          trackingNumber,
        }),
        attachments: logo ? [logo] : undefined,
      });
      return { success: true };
    } catch (error: unknown) {
      const err = error as Error;
      console.error("Error sending status update email:", err);
      throw new Error("Failed to send status update email");
    }
  },
) as unknown as (payload: {
  data: {
    orderNumber: string;
    customerEmail: string;
    customerName: string;
    status: string;
    trackingNumber?: string;
  };
}) => Promise<{ success: boolean; message?: string }>;

