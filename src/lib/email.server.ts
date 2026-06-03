"use server";

import nodemailer from "nodemailer";

export interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
}

export async function sendContactEmail(
  data: ContactFormData,
): Promise<{ success: boolean; message: string }> {
  console.log("Server function called with data:", data);

  const { firstName, lastName, email, subject, message } = data;

  // Validate required fields
  if (!firstName || !lastName || !email || !message) {
    throw new Error(
      "Missing required fields: firstName, lastName, email, and message are required",
    );
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Invalid email format");
  }

  // Check for email credentials
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  console.log("Email config check:", {
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: process.env.EMAIL_PORT || "587",
    userSet: !!emailUser,
    passSet: !!emailPass,
  });

  if (!emailUser || !emailPass) {
    console.warn("Email credentials not configured - logging to console instead");
    console.log("================ CONTACT FORM SUBMISSION ================");
    console.log(`From: ${firstName} ${lastName} (${email})`);
    console.log(`Subject: ${subject || "No subject"}`);
    console.log(`Message: ${message}`);
    console.log("=========================================================");

    return {
      success: true,
      message:
        "Message logged to console (configure EMAIL_USER and EMAIL_PASS to send actual emails)",
    };
  }

  // Configure nodemailer transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
      <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #333333; margin-bottom: 20px;">New Contact Form Submission</h2>
        <div style="border-bottom: 1px solid #eeeeee; padding-bottom: 20px; margin-bottom: 20px;"></div>
        
        <div style="margin-bottom: 15px;">
          <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0;"><strong>First Name:</strong> ${firstName}</p>
          <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0;"><strong>Last Name:</strong> ${lastName}</p>
          <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0;"><strong>Email:</strong> ${email}</p>
          <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0;"><strong>Subject:</strong> ${subject || "No subject"}</p>
        </div>
        
        <div style="margin-bottom: 15px;">
          <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0;"><strong>Message:</strong></p>
          <p style="color: #333333; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eeeeee;">
          <p style="color: #999999; font-size: 12px;">This message was sent from the Little Luxuries contact form.</p>
          <p style="color: #999999; font-size: 12px;">Time: ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  `;

  try {
    // Verify transporter connection
    await transporter.verify();
    console.log("Transporter verified successfully");

    const info = await transporter.sendMail({
      from: emailUser,
      to: "jahanzaib0013@gmail.com",
      subject: `Little Luxuries Contact: ${subject || "New Message"}`,
      text: `New message from ${firstName} ${lastName} (${email}): ${message}`,
      html: emailContent,
    });

    console.log("Email sent successfully:", info.messageId);

    return { success: true, message: "Email sent successfully to jahanzaib0013@gmail.com" };
  } catch (error: any) {
    console.error("Error sending email:", error);
    throw new Error(`Failed to send email: ${error?.message || "Unknown error"}`);
  }
}
