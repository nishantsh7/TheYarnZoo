import type { Order } from '@/types';

interface OrderStatusUpdateEmailProps {
  customerName: string;
  orderId: string;
  newStatus: Order['orderStatus'];
  trackingNumber?: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const logoUrl = 'https://res.cloudinary.com/djvwsukm2/image/upload/v1750182328/WhatsApp_Image_2025-06-17_at_22.54.25_3_-Photoroom_mqtkaz.png';

export const generateOrderStatusUpdateHtml = ({
  customerName,
  orderId,
  newStatus,
  trackingNumber,
}: OrderStatusUpdateEmailProps): string => {

  const getStatusText = () => {
    switch (newStatus) {
      case 'processing':
        return {
          heading: "We're getting your order ready!",
          body: "We're excited to let you know that we've started processing your order. We'll notify you again once it has shipped.",
        };
      case 'shipped':
        return {
          heading: "Great news! Your order has shipped.",
          body: `Your order is on its way. You can track your package using the tracking number below.`,
        };
      case 'delivered':
        return {
          heading: "Your order has been delivered!",
          body: "We hope you love your new handcrafted friends! Thank you for shopping with us.",
        };
      case 'cancelled':
        return {
          heading: "Your order has been cancelled.",
          body: "Your order has been successfully cancelled. If you have any questions, please don't hesitate to contact our support team.",
        };
      default:
        return {
          heading: "Your order status has been updated.",
          body: "There is a new update regarding your order.",
        };
    }
  };

  const { heading, body } = getStatusText();

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your TheYarnZoo Order Status Update</title>
      <style>
        body { margin: 0; padding: 0; background-color: #f6f9fc; font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif; }
        .container { background-color: #ffffff; margin: 0 auto; padding: 20px 0 48px; margin-bottom: 64px; border: 1px solid #f0f0f0; border-radius: 4px; max-width: 600px; }
        .logo { margin: 0 auto; display: block; }
        .h1 { color: #333; font-size: 24px; font-weight: bold; text-align: center; margin: 30px 0; padding: 0; }
        .text { color: #525f7f; font-size: 16px; line-height: 24px; text-align: left; padding: 0 20px; }
        .link { color: #D87093; font-size: 16px; text-decoration: underline; display: block; margin: 20px auto; text-align: center; font-weight: bold; }
        .codeBox { background: #f6f9fc; border: 1px solid #f0f0f0; padding: 10px 20px; margin: 20px; border-radius: 4px; }
        .codeText { color: #333; font-size: 16px; line-height: 24px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <img src="${logoUrl}" width="120" height="120" alt="TheYarnZoo Logo" class="logo">
        <h1 class="h1">${heading}</h1>
        <p class="text">Hi ${customerName},</p>
        <p class="text">${body}</p>
        <p class="text">Order ID: <strong>${orderId}</strong></p>
        ${newStatus === 'shipped' && trackingNumber ? `
          <div class="codeBox">
            <p class="codeText">Tracking Number: ${trackingNumber}</p>
          </div>
        ` : ''}
        <p class="text">You can view your order details here:</p>
        <a href="${baseUrl}/orders/${orderId}" class="link">View My Order</a>
        <p class="text">Thanks for being a part of the TheYarnZoo family!</p>
      </div>
    </body>
    </html>
  `;
};