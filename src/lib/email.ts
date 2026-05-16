import nodemailer from "nodemailer";

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configure the email transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: parseInt(process.env.EMAIL_PORT || "587"),
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER || "",
        pass: process.env.EMAIL_PASS || "",
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER || "",
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html || options.text,
      };

      await this.transporter.sendMail(mailOptions);
      console.log("Email sent successfully to:", options.to);
      return true;
    } catch (error) {
      console.error("Error sending email:", error);
      return false;
    }
  }

  async sendContactForm(data: {
    firstName: string;
    lastName: string;
    email: string;
    subject: string;
    message: string;
  }): Promise<boolean> {
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #333333; margin-bottom: 20px;">New Contact Form Submission</h2>
          <div style="border-bottom: 1px solid #eeeeee; padding-bottom: 20px; margin-bottom: 20px;"></div>
          
          <div style="margin-bottom: 15px;">
            <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0;"><strong>First Name:</strong> ${data.firstName}</p>
            <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0;"><strong>Last Name:</strong> ${data.lastName}</p>
            <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0;"><strong>Email:</strong> ${data.email}</p>
            <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0;"><strong>Subject:</strong> ${data.subject}</p>
          </div>
          
          <div style="margin-bottom: 15px;">
            <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0;"><strong>Message:</strong></p>
            <p style="color: #333333; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${data.message}</p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eeeeee;">
            <p style="color: #999999; font-size: 12px;">This message was sent from the Little Luxuries contact form.</p>
            <p style="color: #999999; font-size: 12px;">Time: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    `;

    return await this.sendEmail({
      to: "jahanzaib0013@gmail.com",
      subject: `Little Luxuries Contact: ${data.subject}`,
      text: emailContent,
      html: emailContent,
    });
  }
}
