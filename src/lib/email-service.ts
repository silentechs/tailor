import { Resend } from 'resend';
import prisma from './prisma';

// ============================================
// Email Service - Resend Integration
// ============================================

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const APP_NAME = 'StitchCraft Ghana';

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

// ============================================
// Core Email Function
// ============================================

export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  if (!resend) {
    console.log('[EMAIL] Resend not configured, logging email:');
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Body: ${options.text || options.html.substring(0, 200)}...`);

    return {
      success: true,
      messageId: `mock_${Date.now()}`,
    };
  }

  try {
    // Check if FROM_EMAIL already has a Name <email> format to avoid double wrapping
    const fromAddress = FROM_EMAIL.includes('<')
      ? FROM_EMAIL
      : `${APP_NAME} <${FROM_EMAIL}>`;

    console.log(`[EMAIL DEBUG] Sending from: ${fromAddress} to: ${options.to}`);

    const result = await resend.emails.send({
      from: fromAddress,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
    });

    if (result.error) {
      console.error('[EMAIL ERROR] Resend returned error:', result.error);
      await logEmailAttempt(options.to, options.subject, 'failed', undefined, result.error.message);
      return { success: false, error: result.error.message };
    }

    console.log('[EMAIL SENT] Message ID:', result.data?.id);
    await logEmailAttempt(options.to, options.subject, 'sent', result.data?.id);
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('[EMAIL EXCEPTION]', error);
    const errorMessage = error instanceof Error ? error.message : 'Email send failed';
    await logEmailAttempt(options.to, options.subject, 'failed', undefined, errorMessage);
    return { success: false, error: errorMessage };
  }
}

async function logEmailAttempt(
  recipient: string,
  subject: string,
  status: string,
  messageId?: string,
  errorMessage?: string
) {
  try {
    await prisma.emailNotification.create({
      data: {
        recipient,
        subject,
        template: 'custom',
        status,
        messageId,
        errorMessage,
      },
    });
  } catch (error) {
    console.error('Failed to log email attempt:', error);
  }
}

// ============================================
// Email Templates
// ============================================

export async function sendRegistrationEmail(
  to: string,
  userName: string,
  adminEmail: string
): Promise<EmailResult> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #006B3F, #FCD116); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: white; margin: 0; text-shadow: 1px 1px 2px rgba(0,0,0,0.3); }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .highlight { background: #FCD116; padding: 2px 8px; border-radius: 4px; font-weight: bold; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🧵 New Registration Request</h1>
        </div>
        <div class="content">
          <p>Hello Admin,</p>
          <p>A new tailor has registered on StitchCraft Ghana:</p>
          <p><strong>Name:</strong> <span class="highlight">${userName}</span></p>
          <p><strong>Email:</strong> ${to}</p>
          <p>Please review their application in the admin dashboard and approve or reject their registration.</p>
          <p>Best regards,<br>StitchCraft Ghana System</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} StitchCraft Ghana. Proudly Made in Ghana.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: adminEmail,
    subject: `New Registration: ${userName} - Pending Approval`,
    html,
    text: `New registration request from ${userName} (${to}). Please review in the admin dashboard.`,
  });
}

export async function sendApprovalEmail(
  to: string,
  userName: string,
  loginUrl: string
): Promise<EmailResult> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #006B3F, #FCD116); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: white; margin: 0; text-shadow: 1px 1px 2px rgba(0,0,0,0.3); }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .btn { display: inline-block; background: #006B3F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to StitchCraft Ghana!</h1>
        </div>
        <div class="content">
          <p>Dear ${userName},</p>
          <p>Great news! Your StitchCraft Ghana account has been <strong style="color: #006B3F;">approved</strong>!</p>
          <p>You can now log in and start managing your tailoring business:</p>
          <ul>
            <li>Manage your clients and their orders</li>
            <li>Track payments and generate invoices</li>
            <li>Showcase your work to potential clients</li>
            <li>Send SMS and email notifications</li>
          </ul>
          <a href="${loginUrl}" class="btn">Log In Now</a>
          <p style="margin-top: 20px;">Welcome to the StitchCraft family!</p>
          <p>Best regards,<br>The StitchCraft Ghana Team</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} StitchCraft Ghana. Proudly Made in Ghana.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: 'Welcome to StitchCraft Ghana - Account Approved! 🎉',
    html,
    text: `Dear ${userName}, Your StitchCraft Ghana account has been approved! Log in at: ${loginUrl}`,
  });
}

export async function sendRejectionEmail(
  to: string,
  userName: string,
  reason?: string
): Promise<EmailResult> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #CE1126; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: white; margin: 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Registration Update</h1>
        </div>
        <div class="content">
          <p>Dear ${userName},</p>
          <p>We regret to inform you that your StitchCraft Ghana registration could not be approved at this time.</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          <p>If you believe this is an error or would like more information, please contact our support team.</p>
          <p>Best regards,<br>The StitchCraft Ghana Team</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} StitchCraft Ghana. Proudly Made in Ghana.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: 'StitchCraft Ghana - Registration Update',
    html,
    text: `Dear ${userName}, We regret to inform you that your registration could not be approved. ${reason || ''}`,
  });
}

export async function sendInvoiceEmail(
  to: string,
  clientName: string,
  invoiceNumber: string,
  amount: string,
  invoiceUrl: string
): Promise<EmailResult> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #006B3F, #FCD116); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: white; margin: 0; text-shadow: 1px 1px 2px rgba(0,0,0,0.3); }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .invoice-box { background: white; border: 2px solid #FCD116; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
        .amount { font-size: 28px; font-weight: bold; color: #006B3F; }
        .btn { display: inline-block; background: #006B3F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📄 Invoice ${invoiceNumber}</h1>
        </div>
        <div class="content">
          <p>Dear ${clientName},</p>
          <p>Please find your invoice attached below:</p>
          <div class="invoice-box">
            <p style="margin: 0; color: #666;">Amount Due</p>
            <p class="amount">${amount}</p>
            <p style="margin: 0; color: #666;">Invoice #${invoiceNumber}</p>
          </div>
          <a href="${invoiceUrl}" class="btn">View Invoice</a>
          <p style="margin-top: 20px;">Thank you for your business!</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} StitchCraft Ghana. Proudly Made in Ghana.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Invoice ${invoiceNumber} - ${amount}`,
    html,
    text: `Dear ${clientName}, Your invoice ${invoiceNumber} for ${amount} is ready. View it at: ${invoiceUrl}`,
  });
}

export async function sendReceiptEmail(
  to: string,
  clientName: string,
  paymentNumber: string,
  amount: string,
  receiptUrl: string
): Promise<EmailResult> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #006B3F, #FCD116); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: white; margin: 0; text-shadow: 1px 1px 2px rgba(0,0,0,0.3); }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .receipt-box { background: #006B3F; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
        .amount { font-size: 28px; font-weight: bold; color: #FCD116; }
        .btn { display: inline-block; background: #FCD116; color: #006B3F; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Payment Received</h1>
        </div>
        <div class="content">
          <p>Dear ${clientName},</p>
          <p>Thank you! We have received your payment:</p>
          <div class="receipt-box">
            <p style="margin: 0; opacity: 0.9;">Amount Paid</p>
            <p class="amount">${amount}</p>
            <p style="margin: 0; opacity: 0.9;">Receipt #${paymentNumber}</p>
          </div>
          <a href="${receiptUrl}" class="btn">Download Receipt</a>
          <p style="margin-top: 20px;">Thank you for your payment!</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} StitchCraft Ghana. Proudly Made in Ghana.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Payment Receipt ${paymentNumber} - ${amount}`,
    html,
    text: `Dear ${clientName}, Thank you for your payment of ${amount}. Receipt: ${paymentNumber}. Download at: ${receiptUrl}`,
  });
}

export async function sendOrderStatusEmail(
  to: string,
  clientName: string,
  orderNumber: string,
  status: string,
  details: string
): Promise<EmailResult> {
  const statusColors: Record<string, string> = {
    CONFIRMED: '#FCD116',
    IN_PROGRESS: '#006B3F',
    READY_FOR_FITTING: '#006B3F',
    COMPLETED: '#006B3F',
    CANCELLED: '#CE1126',
  };

  const color = statusColors[status] || '#006B3F';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${color}; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: ${status === 'CONFIRMED' ? '#333' : 'white'}; margin: 0; text-shadow: 1px 1px 2px rgba(0,0,0,0.1); }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #eee; }
        .status-badge { display: inline-block; background: ${color}; color: ${status === 'CONFIRMED' ? '#333' : 'white'}; padding: 5px 15px; border-radius: 20px; font-weight: bold; font-size: 14px; margin-bottom: 20px; text-transform: uppercase; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Update on Order ${orderNumber}</h1>
        </div>
        <div class="content">
          <p>Dear ${clientName},</p>
          <div class="status-badge">${status.replace(/_/g, ' ')}</div>
          <p>${details}</p>
          <p>We are working hard to ensure your garment is perfect. We will notify you again when there's another update.</p>
          <p>Best regards,<br>The StitchCraft Ghana Team</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} StitchCraft Ghana. Proudly Made in Ghana.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Order Update: ${orderNumber} is now ${status.replace(/_/g, ' ')}`,
    html,
    text: `Dear ${clientName}, Your order ${orderNumber} is now ${status.replace(/_/g, ' ')}. ${details}`,
  });
}
export async function sendInvitationEmail(
  to: string,
  inviterName: string,
  organizationName: string,
  role: string,
  inviteUrl: string
): Promise<EmailResult> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #006B3F, #FCD116); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: white; margin: 0; text-shadow: 1px 1px 2px rgba(0,0,0,0.3); }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .btn { display: inline-block; background: #006B3F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🤝 Team Invitation</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>You have been invited by <strong>${inviterName}</strong> to join <strong>${organizationName}</strong> as a <strong>${role}</strong> on StitchCraft Ghana.</p>
          <p>Click the button below to accept your invitation and join the team:</p>
          <a href="${inviteUrl}" class="btn">Accept Invitation</a>
          <p style="margin-top: 20px;">If you already have an account, you'll be added to the organization. If not, you'll be guided through the registration process.</p>
          <p>Best regards,<br>The StitchCraft Ghana Team</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} StitchCraft Ghana. Proudly Made in Ghana.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Join ${organizationName} on StitchCraft Ghana`,
    html,
    text: `You have been invited by ${inviterName} to join ${organizationName} as a ${role}. Accept here: ${inviteUrl}`,
  });
}

export async function sendAppointmentConfirmationEmail(
  to: string,
  clientName: string,
  appointmentType: string,
  date: string,
  time: string,
  location?: string,
  notes?: string
): Promise<EmailResult> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #006B3F, #FCD116); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: white; margin: 0; text-shadow: 1px 1px 2px rgba(0,0,0,0.3); }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .details-box { background: white; border-left: 4px solid #006B3F; padding: 15px; margin: 20px 0; border-radius: 0 4px 4px 0; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
        .detail-row { display: flex; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
        .detail-label { font-weight: bold; width: 100px; color: #555; }
        .detail-value { flex: 1; color: #333; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📅 Appointment Confirmed</h1>
        </div>
        <div class="content">
          <p>Dear ${clientName},</p>
          <p>Your appointment has been successfully scheduled. We look forward to seeing you!</p>
          
          <div class="details-box">
            <div class="detail-row">
              <div class="detail-label">Type:</div>
              <div class="detail-value">${appointmentType}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Date:</div>
              <div class="detail-value">${date}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Time:</div>
              <div class="detail-value">${time}</div>
            </div>
            ${location ? `
            <div class="detail-row">
              <div class="detail-label">Location:</div>
              <div class="detail-value">${location}</div>
            </div>` : ''}
            ${notes ? `
            <div class="detail-row" style="border-bottom: none;">
              <div class="detail-label">Notes:</div>
              <div class="detail-value">${notes}</div>
            </div>` : ''}
          </div>
          
          <p>If you need to reschedule or cancel, please contact us as soon as possible.</p>
          <p>Best regards,<br>The StitchCraft Ghana Team</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} StitchCraft Ghana. Proudly Made in Ghana.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Appointment Confirmed: ${appointmentType} on ${date}`,
    html,
    text: `Dear ${clientName}, your ${appointmentType} appointment is confirmed for ${date} at ${time}. ${location ? `Location: ${location}` : ''}`,
  });
}

export async function sendAppointmentReminderEmail(
  to: string,
  clientName: string,
  appointmentType: string,
  time: string,
  location?: string
): Promise<EmailResult> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #006B3F; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: white; margin: 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .time-badge { display: inline-block; background: #FCD116; color: #006B3F; padding: 5px 15px; border-radius: 20px; font-weight: bold; font-size: 18px; margin: 10px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ Appointment Reminder</h1>
        </div>
        <div class="content">
          <p>Dear ${clientName},</p>
          <p>This is a quick reminder about your upcoming appointment with StitchCraft Ghana today.</p>
          
          <div style="text-align: center; margin: 20px 0;">
            <p style="margin-bottom: 5px;"><strong>${appointmentType}</strong></p>
            <div class="time-badge">Today at ${time}</div>
            ${location ? `<p style="margin-top: 5px; color: #666;">📍 ${location}</p>` : ''}
          </div>
          
          <p>We're ready for you! If you're running late, please let us know.</p>
          <p>See you soon!</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} StitchCraft Ghana. Proudly Made in Ghana.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Reminder: Appointment Today at ${time}`,
    html,
    text: `Dear ${clientName}, quick reminder for your ${appointmentType} appointment today at ${time}. See you soon!`,
  });
}
