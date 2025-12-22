import { Resend } from 'resend';
import { captureError } from './logger';
import prisma from './prisma';

// ============================================
// Email Service - Resend Integration
// ============================================

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// ============================================
// Email Layout & Branding
// ============================================

const APP_URL =
  process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'StitchCraft Ghana';

// Ghana-inspired brand colors (configurable via env)
const BRAND_COLORS = {
  primary: process.env.BRAND_PRIMARY_COLOR || '#006B3F', // Ghana Green
  secondary: process.env.BRAND_SECONDARY_COLOR || '#FCD116', // Ghana Gold
  accent: process.env.BRAND_ACCENT_COLOR || '#CE1126', // Ghana Red
  dark: '#1A1A1A',
  light: '#F9FAFB',
};

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
  template?: string; // Optional template identifier for logging
}

/**
 * Wraps content in the standard StitchCraft Ghana email layout
 */
export function getEmailLayout(content: string, options: { subject: string; preheader?: string }) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${options.subject}</title>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0; 
          padding: 0;
          background-color: ${BRAND_COLORS.light};
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 20px; 
        }
        .header { 
          background: linear-gradient(135deg, ${BRAND_COLORS.primary}, ${BRAND_COLORS.secondary}); 
          padding: 40px 20px; 
          text-align: center; 
          border-radius: 12px 12px 0 0; 
        }
        .header h1 { 
          color: white; 
          margin: 0; 
          text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
          font-size: 28px;
          letter-spacing: -0.5px;
        }
        .logo-icon {
          font-size: 40px;
          margin-bottom: 10px;
          display: block;
        }
        .content { 
          background: #ffffff; 
          padding: 40px; 
          border-radius: 0 0 12px 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .btn { 
          display: inline-block; 
          background: ${BRAND_COLORS.primary}; 
          color: #ffffff !important; 
          padding: 14px 28px; 
          text-decoration: none; 
          border-radius: 8px; 
          margin-top: 25px; 
          font-weight: bold;
          text-align: center;
        }
        .btn:hover {
          background: ${BRAND_COLORS.dark};
        }
        .footer { 
          text-align: center; 
          margin-top: 30px; 
          color: #666; 
          font-size: 13px;
          padding: 20px;
        }
        .highlight { 
          background: ${BRAND_COLORS.secondary}; 
          padding: 2px 6px; 
          border-radius: 4px; 
          font-weight: bold; 
        }
        .card {
          border: 1px solid #eee;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          background: #fafafa;
        }
        @media only screen and (max-width: 600px) {
          .content { padding: 25px 20px; }
          .header { padding: 30px 15px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <span class="logo-icon">🧵</span>
          <h1>${APP_NAME}</h1>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>You received this email from ${APP_NAME}, a product of Silentech Solution Limited.</p>
          <p>© ${new Date().getFullYear()} Silentech Solution Limited. Proudly Made in Ghana. 🇬🇭</p>
          <p style="font-size: 11px; color: #999; margin-top: 15px;">
            If you have any questions, please reply to this email or visit our website.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ============================================
// Core Email Function
// ============================================

export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const templateName = options.template || 'custom';

  if (!resend) {
    // Log the "mock" attempt
    const mockMessageId = `mock_${Date.now()}`;
    await logEmailAttempt(options.to, options.subject, 'mock_sent', templateName, mockMessageId);

    return {
      success: true,
      messageId: mockMessageId,
    };
  }

  try {
    // Check if FROM_EMAIL already has a Name <email> format to avoid double wrapping
    const fromAddress = FROM_EMAIL.includes('<') ? FROM_EMAIL : `${APP_NAME} <${FROM_EMAIL}>`;

    const result = await resend.emails.send({
      from: fromAddress,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
    });

    if (result.error) {
      captureError('EmailService', result.error, { template: templateName });
      await logEmailAttempt(
        options.to,
        options.subject,
        'failed',
        templateName,
        undefined,
        result.error.message
      );
      return { success: false, error: result.error.message };
    }

    const messageId = result.data?.id;
    await logEmailAttempt(options.to, options.subject, 'sent', templateName, messageId);
    return { success: true, messageId };
  } catch (error) {
    captureError('EmailService', error, { template: templateName });
    const errorMessage = error instanceof Error ? error.message : 'Email send failed';
    await logEmailAttempt(
      options.to,
      options.subject,
      'failed',
      templateName,
      undefined,
      errorMessage
    );
    return { success: false, error: errorMessage };
  }
}

async function logEmailAttempt(
  recipient: string,
  subject: string,
  status: string,
  template: string,
  messageId?: string,
  errorMessage?: string
) {
  try {
    await prisma.emailNotification.create({
      data: {
        recipient,
        subject,
        template,
        status,
        messageId,
        errorMessage,
      },
    });
  } catch (error) {
    captureError('EmailService', error, { context: 'logEmailAttempt' });
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
  const subject = `New Registration: ${userName} - Pending Approval`;
  const content = `
    <p>Hello Admin,</p>
    <p>A new tailor has registered on <strong>StitchCraft Ghana</strong>:</p>
    <div class="card">
      <p style="margin: 0;"><strong>Name:</strong> <span class="highlight">${userName}</span></p>
      <p style="margin: 10px 0 0 0;"><strong>Email:</strong> ${to}</p>
    </div>
    <p>Please review their application in the admin dashboard and approve or reject their registration.</p>
    <div style="text-align: center;">
      <a href="${APP_URL}/admin/users" class="btn">Go to Admin Dashboard</a>
    </div>
  `;

  return sendEmail({
    to: adminEmail,
    subject,
    html: getEmailLayout(content, { subject }),
    text: `New registration request from ${userName} (${to}). Please review in the admin dashboard.`,
    template: 'registration_request',
  });
}

export async function sendApprovalEmail(
  to: string,
  userName: string,
  loginUrl: string
): Promise<EmailResult> {
  const subject = 'Welcome to StitchCraft Ghana - Account Approved! 🎉';
  const content = `
    <p>Dear ${userName},</p>
    <p>Great news! Your StitchCraft Ghana account has been <strong style="color: ${BRAND_COLORS.primary};">approved</strong>!</p>
    <p>You can now log in and start managing your tailoring business:</p>
    <ul>
      <li>Manage your clients and their orders</li>
      <li>Track payments and generate invoices</li>
      <li>Showcase your work to potential clients</li>
      <li>Send SMS and email notifications</li>
    </ul>
    <div style="text-align: center;">
      <a href="${loginUrl}" class="btn">Log In to Your Account</a>
    </div>
    <p style="margin-top: 30px;">Welcome to the StitchCraft family!</p>
  `;

  return sendEmail({
    to,
    subject,
    html: getEmailLayout(content, { subject }),
    text: `Dear ${userName}, Your StitchCraft Ghana account has been approved! Log in at: ${loginUrl}`,
    template: 'account_approval',
  });
}

export async function sendRejectionEmail(
  to: string,
  userName: string,
  reason?: string
): Promise<EmailResult> {
  const subject = 'StitchCraft Ghana - Registration Update';
  const content = `
    <h2 style="color: ${BRAND_COLORS.accent};">Registration Update</h2>
    <p>Dear ${userName},</p>
    <p>We regret to inform you that your StitchCraft Ghana registration could not be approved at this time.</p>
    ${reason ? `<div class="card"><strong>Reason:</strong> ${reason}</div>` : ''}
    <p>If you believe this is an error or would like more information, please contact our support team.</p>
    <p>Best regards,<br>The StitchCraft Ghana Team</p>
  `;

  return sendEmail({
    to,
    subject,
    html: getEmailLayout(content, { subject }),
    text: `Dear ${userName}, We regret to inform you that your registration could not be approved. ${reason || ''}`,
    template: 'account_rejection',
  });
}

export async function sendInvoiceEmail(
  to: string,
  clientName: string,
  invoiceNumber: string,
  amount: string,
  invoiceUrl: string
): Promise<EmailResult> {
  const subject = `Invoice ${invoiceNumber} - ${amount}`;
  const content = `
    <p>Dear ${clientName},</p>
    <p>Please find your invoice details below:</p>
    <div class="card" style="text-align: center; border: 2px solid ${BRAND_COLORS.secondary};">
      <p style="margin: 0; color: #666; font-size: 14px;">Amount Due</p>
      <p style="font-size: 32px; font-weight: bold; color: ${BRAND_COLORS.primary}; margin: 10px 0;">${amount}</p>
      <p style="margin: 0; color: #666; font-size: 14px;">Invoice #${invoiceNumber}</p>
    </div>
    <div style="text-align: center;">
      <a href="${invoiceUrl}" class="btn">View & Download Invoice</a>
    </div>
    <p style="margin-top: 30px;">Thank you for your business!</p>
  `;

  return sendEmail({
    to,
    subject,
    html: getEmailLayout(content, { subject }),
    text: `Dear ${clientName}, Your invoice ${invoiceNumber} for ${amount} is ready. View it at: ${invoiceUrl}`,
    template: 'invoice_sent',
  });
}

export async function sendReceiptEmail(
  to: string,
  clientName: string,
  paymentNumber: string,
  amount: string,
  receiptUrl: string
): Promise<EmailResult> {
  const subject = `Payment Receipt ${paymentNumber} - ${amount}`;
  const content = `
    <h2 style="color: ${BRAND_COLORS.primary};">✅ Payment Received</h2>
    <p>Dear ${clientName},</p>
    <p>Thank you! We have received your payment. Here are the details:</p>
    <div class="card" style="text-align: center; background-color: ${BRAND_COLORS.primary}; color: white;">
      <p style="margin: 0; opacity: 0.9; font-size: 14px;">Amount Paid</p>
      <p style="font-size: 32px; font-weight: bold; color: ${BRAND_COLORS.secondary}; margin: 10px 0;">${amount}</p>
      <p style="margin: 0; opacity: 0.9; font-size: 14px;">Receipt #${paymentNumber}</p>
    </div>
    <div style="text-align: center;">
      <a href="${receiptUrl}" class="btn" style="background-color: ${BRAND_COLORS.secondary}; color: ${BRAND_COLORS.primary} !important;">Download Receipt</a>
    </div>
    <p style="margin-top: 30px;">Thank you for your payment!</p>
  `;

  return sendEmail({
    to,
    subject,
    html: getEmailLayout(content, { subject }),
    text: `Dear ${clientName}, Thank you for your payment of ${amount}. Receipt: ${paymentNumber}. Download at: ${receiptUrl}`,
    template: 'payment_receipt',
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
    CONFIRMED: BRAND_COLORS.secondary,
    IN_PROGRESS: BRAND_COLORS.primary,
    READY_FOR_FITTING: BRAND_COLORS.primary,
    COMPLETED: BRAND_COLORS.primary,
    CANCELLED: BRAND_COLORS.accent,
  };

  const color = statusColors[status] || BRAND_COLORS.primary;
  const subject = `Order Update: ${orderNumber} is now ${status.replace(/_/g, ' ')}`;

  const content = `
    <p>Dear ${clientName},</p>
    <div style="display: inline-block; background: ${color}; color: ${status === 'CONFIRMED' ? '#333' : 'white'}; padding: 6px 16px; border-radius: 20px; font-weight: bold; font-size: 14px; margin-bottom: 20px; text-transform: uppercase;">
      ${status.replace(/_/g, ' ')}
    </div>
    <div class="card">
      <p style="margin: 0; font-size: 16px; line-height: 1.8;">${details}</p>
    </div>
    <p>We are working hard to ensure your garment is perfect. We will notify you again when there's another update.</p>
    <div style="text-align: center;">
      <a href="${APP_URL}/track" class="btn">Track Your Order</a>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    html: getEmailLayout(content, { subject }),
    text: `Dear ${clientName}, Your order ${orderNumber} is now ${status.replace(/_/g, ' ')}. ${details}`,
    template: 'order_status_update',
  });
}

export async function sendInvitationEmail(
  to: string,
  inviterName: string,
  organizationName: string,
  role: string,
  inviteUrl: string
): Promise<EmailResult> {
  const subject = `Join ${organizationName} on StitchCraft Ghana`;
  const content = `
    <h2 style="color: ${BRAND_COLORS.primary};">🤝 Team Invitation</h2>
    <p>Hello,</p>
    <p>You have been invited by <strong>${inviterName}</strong> to join <strong>${organizationName}</strong> as a <strong>${role}</strong> on StitchCraft Ghana.</p>
    <p>Click the button below to accept your invitation and join the team:</p>
    <div style="text-align: center;">
      <a href="${inviteUrl}" class="btn">Accept Invitation</a>
    </div>
    <p style="margin-top: 30px;">If you already have an account, you'll be added to the organization. If not, you'll be guided through the registration process.</p>
  `;

  return sendEmail({
    to,
    subject,
    html: getEmailLayout(content, { subject }),
    text: `You have been invited by ${inviterName} to join ${organizationName} as a ${role}. Accept here: ${inviteUrl}`,
    template: 'team_invitation',
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
  const subject = `Appointment Confirmed: ${appointmentType} on ${date}`;
  const content = `
    <h2 style="color: ${BRAND_COLORS.primary};">📅 Appointment Confirmed</h2>
    <p>Dear ${clientName},</p>
    <p>Your appointment has been successfully scheduled. We look forward to seeing you!</p>
    
    <div class="card" style="border-left: 4px solid ${BRAND_COLORS.primary};">
      <p style="margin: 0 0 10px 0;"><strong>Type:</strong> ${appointmentType}</p>
      <p style="margin: 0 0 10px 0;"><strong>Date:</strong> ${date}</p>
      <p style="margin: 0 0 10px 0;"><strong>Time:</strong> ${time}</p>
      ${location ? `<p style="margin: 0 0 10px 0;"><strong>Location:</strong> ${location}</p>` : ''}
      ${notes ? `<p style="margin: 0;"><strong>Notes:</strong> ${notes}</p>` : ''}
    </div>
    
    <p>If you need to reschedule or cancel, please contact us as soon as possible.</p>
  `;

  return sendEmail({
    to,
    subject,
    html: getEmailLayout(content, { subject }),
    text: `Dear ${clientName}, your ${appointmentType} appointment is confirmed for ${date} at ${time}. ${location ? `Location: ${location}` : ''}`,
    template: 'appointment_confirmation',
  });
}

export async function sendAppointmentReminderEmail(
  to: string,
  clientName: string,
  appointmentType: string,
  time: string,
  location?: string
): Promise<EmailResult> {
  const subject = `Reminder: Appointment Today at ${time}`;
  const content = `
    <h2 style="color: ${BRAND_COLORS.primary};">⏰ Appointment Reminder</h2>
    <p>Dear ${clientName},</p>
    <p>This is a quick reminder about your upcoming appointment with <strong>StitchCraft Ghana</strong> today.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <p style="margin-bottom: 10px; font-size: 18px;"><strong>${appointmentType}</strong></p>
      <div style="display: inline-block; background: ${BRAND_COLORS.secondary}; color: ${BRAND_COLORS.primary}; padding: 10px 25px; border-radius: 30px; font-weight: bold; font-size: 20px;">
        Today at ${time}
      </div>
      ${location ? `<p style="margin-top: 15px; color: #666;">📍 ${location}</p>` : ''}
    </div>
    
    <p>We're ready for you! If you're running late, please let us know.</p>
    <p>See you soon!</p>
  `;

  return sendEmail({
    to,
    subject,
    html: getEmailLayout(content, { subject }),
    text: `Dear ${clientName}, quick reminder for your ${appointmentType} appointment today at ${time}. See you soon!`,
    template: 'appointment_reminder',
  });
}
