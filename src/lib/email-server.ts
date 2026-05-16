import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
}

export const sendContactEmail = createServerFn({ method: "POST" }).handler(async (ctx) => {
  const nodemailer = await import("nodemailer");
  const path = await import("path");
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
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASSWORD;

  console.log("Email config:", {
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: process.env.EMAIL_PORT || "587",
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
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  const emailContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Contact Form - Little Luxuries</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8f7fa; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center" style="padding: 60px 20px;">
        
        <!-- Main Container -->
        <table width="560" cellpadding="0" cellspacing="0" role="presentation" style="background: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);">
          
          <!-- Header with Logo -->
          <tr>
            <td align="center" style="padding: 40px 40px 30px; background: #faf9fc; border-radius: 16px 16px 0 0;">
              <!-- Logo -->
              <img src="cid:logo" alt="Little Luxuries" width="64" height="64" style="margin: 0 auto 16px; border-radius: 50%; display: block; object-fit: cover;" />
              
              <!-- Brand Name -->
              <h1 style="margin: 0; font-size: 22px; font-weight: 600; color: #5b21b6; letter-spacing: 0.5px;">Little Luxuries</h1>
              <p style="margin: 6px 0 0; font-size: 12px; color: #7c3aed; letter-spacing: 2px; text-transform: uppercase;">Curated Elegance</p>
            </td>
          </tr>
          
          <!-- Gold Accent Line -->
          <tr>
            <td style="height: 3px; background: linear-gradient(90deg, #fbbf24 0%, #f59e0b 50%, #fbbf24 100%);"></td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 36px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                
                <!-- Title -->
                <tr>
                  <td style="padding-bottom: 28px;">
                    <p style="margin: 0; font-size: 13px; color: #7c3aed; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">New Contact Message</p>
                    <h2 style="margin: 8px 0 0; font-size: 20px; font-weight: 600; color: #1f2937; font-family: 'Noto Serif', Georgia, serif;">You've received a new inquiry</h2>
                  </td>
                </tr>
                
                <!-- Customer Details -->
                <tr>
                  <td style="padding-bottom: 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background: #faf9fc; border-radius: 12px; border: 1px solid #e9d5ff;">
                      <tr>
                        <td style="padding: 24px;">
                          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                            
                            <tr>
                              <td style="padding-bottom: 16px;">
                                <p style="margin: 0 0 4px; font-size: 11px; color: #7c3aed; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Name</p>
                                <p style="margin: 0; font-size: 16px; color: #1f2937; font-weight: 500;">${firstName} ${lastName}</p>
                              </td>
                            </tr>
                            
                            <tr>
                              <td style="padding-bottom: 16px;">
                                <p style="margin: 0 0 4px; font-size: 11px; color: #7c3aed; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Email</p>
                                <p style="margin: 0; font-size: 15px; color: #4b5563;">
                                  <a href="mailto:${email}" style="color: #7c3aed; text-decoration: none;">${email}</a>
                                </p>
                              </td>
                            </tr>
                            
                            <tr>
                              <td>
                                <p style="margin: 0 0 4px; font-size: 11px; color: #7c3aed; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Subject</p>
                                <p style="margin: 0; font-size: 15px; color: #4b5563;">${subject || "General Inquiry"}</p>
                              </td>
                            </tr>
                            
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Message -->
                <tr>
                  <td style="padding-bottom: 28px;">
                    <p style="margin: 0 0 10px; font-size: 11px; color: #7c3aed; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Message</p>
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background: #faf9fc; border-radius: 12px; border-left: 3px solid #fbbf24;">
                      <tr>
                        <td style="padding: 20px 24px;">
                          <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #374151; white-space: pre-wrap;">${message}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                                
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background: #faf9fc; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0 0 4px; font-size: 13px; color: #5b21b6; font-weight: 600; letter-spacing: 0.5px;">Little Luxuries</p>
              <p style="margin: 0; font-size: 12px; color: #6b7280;">
                ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} at ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>
</body>
</html>
    `;

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
      html: emailContent,
      attachments: [
        {
          filename: "logo.png",
          path: path.default.join(process.cwd(), "src/assets/logo.png"),
          cid: "logo",
        },
      ],
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
    const nodemailer = await import("nodemailer");
    const { email } = data;
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASSWORD;

    if (!emailUser || !emailPass) {
      console.warn("Email credentials not configured. Simulated subscription for:", email);
      return { success: true, message: "Subscribed successfully (simulated)" };
    }

    const transporter = nodemailer.default.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: parseInt(process.env.EMAIL_PORT || "587"),
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    const welcomeEmailHTML = `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 40px 20px; background-color: #f8f7fa; font-family: sans-serif; text-align: center;">
  <div style="max-w: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
    <div style="width: 64px; height: 64px; margin: 0 auto 20px; background: linear-gradient(135deg, #8B5CF6 0%, #A78BFA 50%, #EC4899 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; color: white; font-weight: bold;">LL</div>
    <h1 style="color: #5b21b6; margin-bottom: 10px;">Welcome to the Circle.</h1>
    <p style="color: #4b5563; line-height: 1.6;">Thank you for subscribing to Little Luxuries. As a token of our appreciation, please enjoy 10% off your first heirloom piece.</p>
    <div style="background: #faf9fc; padding: 16px; border-radius: 8px; margin: 24px 0; border: 1px dashed #c4b5fd;">
      <p style="margin: 0; font-size: 12px; color: #7c3aed; text-transform: uppercase; letter-spacing: 1px;">Your Code</p>
      <p style="margin: 4px 0 0; font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #1f2937;">CIRCLE10</p>
    </div>
    <p style="color: #6b7280; font-size: 12px;">Use this code at checkout. Valid for first-time purchases only.</p>
  </div>
</body>
</html>
    `;

    try {
      // Send welcome email to subscriber
      await transporter.sendMail({
        from: `"Little Luxuries" <${emailUser}>`,
        to: email,
        subject: "Welcome to the Circle (Plus 10% Off!)",
        html: welcomeEmailHTML,
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
    const nodemailer = await import("nodemailer");
    const { orderNumber, customerEmail, customerName, status, trackingNumber } = data;
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASSWORD;

    if (!emailUser || !emailPass) {
      console.warn("Email credentials not configured. Order status update logged to console.");
      console.log(`[ORDER EMAIL] To: ${customerEmail}, Order: ${orderNumber}, Status: ${status}`);
      return { success: true, message: "Logged to console (credentials not set)" };
    }

    const transporter = nodemailer.default.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: parseInt(process.env.EMAIL_PORT || "587"),
      secure: process.env.EMAIL_SECURE === "true",
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

    const emailHTML = `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 40px 20px; background-color: #f8f7fa; font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;">
  <div style="max-w: 560px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.05); border: 1px solid #e9d5ff;">
    <div style="background: #faf9fc; padding: 40px; text-align: center; border-bottom: 1px solid #e9d5ff;">
      <div style="font-size: 48px; margin-bottom: 20px;">${config.icon}</div>
      <h1 style="color: #1f2937; margin: 0; font-family: Georgia, serif; font-size: 24px;">${config.title}</h1>
      <p style="color: #7c3aed; text-transform: uppercase; letter-spacing: 2px; font-size: 11px; font-weight: bold; margin-top: 10px;">Order #${orderNumber}</p>
    </div>
    <div style="padding: 40px;">
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-top: 0;">Hello ${customerName},</p>
      <p style="color: #4b5563; font-size: 15px; line-height: 1.7;">${config.message}</p>
      
      ${
        trackingNumber
          ? `
      <div style="margin: 30px 0; padding: 24px; background: #faf9fc; border-radius: 12px; border: 1px dashed #c4b5fd;">
        <p style="margin: 0; font-size: 11px; color: #7c3aed; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Tracking Number</p>
        <p style="margin: 8px 0 0; font-size: 18px; font-weight: bold; color: #1f2937;">${trackingNumber}</p>
      </div>
      `
          : ""
      }
      
      <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin-top: 30px;">
        Thank you for choosing Little Luxuries for your little one.
      </p>
      <p style="color: #1f2937; font-weight: 600; margin-bottom: 0;">Warmly,<br>The Little Luxuries Team</p>
    </div>
    <div style="background: #faf9fc; padding: 20px; text-align: center; border-top: 1px solid #e9d5ff;">
      <p style="margin: 0; font-size: 12px; color: #9ca3af;">&copy; ${new Date().getFullYear()} Little Luxuries · Ethically Crafted Heirlooms</p>
    </div>
  </div>
</body>
</html>
  `;

    try {
      await transporter.sendMail({
        from: `"Little Luxuries" <${emailUser}>`,
        to: customerEmail,
        subject: `${config.title} (Order #${orderNumber})`,
        html: emailHTML,
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
