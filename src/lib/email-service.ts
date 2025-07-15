
'use server';

import type { Order } from "@/types";
import { generateOrderStatusUpdateHtml } from '@/components/emails/OrderStatusUpdateEmail';
import sgMail from '@sendgrid/mail';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;

// Only configure SendGrid if the API key and from email are provided
if (SENDGRID_API_KEY && SENDGRID_FROM_EMAIL) {
  sgMail.setApiKey(SENDGRID_API_KEY);
  console.log("SendGrid email service configured.");
} else {
  console.warn("Email service is not configured. SENDGRID_API_KEY or SENDGRID_FROM_EMAIL environment variables are missing. Emails will be logged to console instead of sent.");
}

interface OrderStatusEmailProps {
  customerEmail: string;
  customerName: string;
  orderId: string;
  newStatus: Order['orderStatus'];
  trackingNumber?: string;
}

export async function sendOrderStatusUpdateEmail({
  customerEmail,
  customerName,
  orderId,
  newStatus,
  trackingNumber,
}: OrderStatusEmailProps): Promise<{ success: boolean; message: string }> {

  let subject = "";
  switch (newStatus) {
    case 'processing': subject = `Your TheYarnZoo Order #${orderId} is being processed!`; break;
    case 'shipped': subject = `Your TheYarnZoo Order #${orderId} has shipped!`; break;
    case 'delivered': subject = `Your TheYarnZoo Order #${orderId} has been delivered!`; break;
    case 'cancelled': subject = `Your TheYarnZoo Order #${orderId} has been cancelled.`; break;
    default:
       console.log("No email action for this status:", newStatus);
       return { success: true, message: "No email action defined for this status." };
  }

  const htmlContent = generateOrderStatusUpdateHtml({
    customerName,
    orderId,
    newStatus,
    trackingNumber,
  });

  // If transporter is not configured, log to console as a fallback
  if (!SENDGRID_API_KEY || !SENDGRID_FROM_EMAIL) {
    console.log("--- 📧 DEVELOPMENT EMAIL (LOGGED TO CONSOLE) 📧 ---");
    console.log(`To: ${customerEmail}`);
    console.log(`From: noreply@theyarnzoo-dev.com (placeholder)`);
    console.log(`Subject: ${subject}`);
    console.log("--- BODY ---");
    console.log(htmlContent);
    return { success: true, message: "Email logged to console because service is not configured." };
  }
  
  const msg = {
    to: customerEmail,
    from: SENDGRID_FROM_EMAIL, 
    subject: subject,
    html: htmlContent,
  };


  // If transporter is configured, try to send the email
  try {
    await sgMail.send(msg);
    console.log(`Email sent successfully to ${customerEmail} via SendGrid`);
    return { success: true, message: "Order status update email sent successfully." };

  } catch (error: any) {
    console.error("SendGrid Error:", error);
    let errorMessage = 'An unexpected error occurred while sending the email.';
    if (error.response) {
      console.error(error.response.body)
      errorMessage = `SendGrid API Error: ${error.response.body.errors[0]?.message || 'Please check your API Key and verified sender.'}`;
    } else {
        errorMessage = error.message;
    }
    return { success: false, message: errorMessage };
  }
}
