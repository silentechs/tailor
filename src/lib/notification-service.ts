import type { NotificationPriority, NotificationType } from '@prisma/client';
import {
  sendAppointmentConfirmationEmail,
  sendAppointmentReminderEmail,
  sendEmail,
  sendInvoiceEmail,
  sendOrderStatusEmail,
  sendReceiptEmail,
} from './email-service';
import prisma from './prisma';
import { SMS_TEMPLATES, sendSMS } from './sms-service';

// ============================================
// Unified Notification Service
// Handles in-app, SMS, and email notifications
// ============================================

export interface NotificationOptions {
  userId: string;
  type: NotificationType;
  priority?: NotificationPriority;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  sendSms?: boolean;
  sendEmail?: boolean;
  smsRecipient?: string;
  emailRecipient?: string;
}

export interface NotificationResult {
  notificationId: string;
  smsSent: boolean;
  emailSent: boolean;
}

// ============================================
// Create Notification
// ============================================

export async function createNotification(
  options: NotificationOptions
): Promise<NotificationResult> {
  const {
    userId,
    type,
    priority = 'MEDIUM',
    title,
    message,
    data,
    sendSms = false,
    sendEmail: shouldSendEmail = false,
    smsRecipient,
    emailRecipient,
  } = options;

  // Create in-app notification
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      priority,
      title,
      message,
      data: data ? (data as object) : undefined,
    },
  });

  let smsSent = false;
  let emailSent = false;

  // Send SMS if requested
  if (sendSms && smsRecipient) {
    const smsResult = await sendSMS(smsRecipient, message);
    smsSent = smsResult.success;

    // Update notification record
    await prisma.notification.update({
      where: { id: notification.id },
      data: { smsSent },
    });
  }

  // Send email if requested
  if (shouldSendEmail && emailRecipient) {
    const emailResult = await sendEmail({
      to: emailRecipient,
      subject: title,
      html: `<p>${message}</p>`,
      text: message,
    });
    emailSent = emailResult.success;

    // Update notification record
    await prisma.notification.update({
      where: { id: notification.id },
      data: { emailSent },
    });
  }

  return {
    notificationId: notification.id,
    smsSent,
    emailSent,
  };
}

// ============================================
// Notification Helpers
// ============================================

export async function markAsRead(notificationId: string): Promise<void> {
  await prisma.notification.update({
    where: { id: notificationId },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

export async function markAllAsRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });
}

export async function getUserNotifications(
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  }
) {
  const { limit = 20, offset = 0, unreadOnly = false } = options || {};

  return prisma.notification.findMany({
    where: {
      userId,
      ...(unreadOnly && { isRead: false }),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });
}

// ============================================
// Pre-built Notification Types
// ============================================

export async function notifyOrderStatusChange(
  tailorId: string,
  clientPhone: string | null,
  clientEmail: string | null,
  orderNumber: string,
  clientName: string,
  newStatus: string,
  notifySms: boolean,
  notifyEmail: boolean
): Promise<void> {
  const statusMessages: Record<string, { title: string; smsTemplate: string }> = {
    CONFIRMED: {
      title: 'Order Confirmed',
      smsTemplate: SMS_TEMPLATES.orderConfirmed(orderNumber, clientName),
    },
    IN_PROGRESS: {
      title: 'Work Started',
      smsTemplate: SMS_TEMPLATES.orderInProgress(orderNumber, clientName),
    },
    READY_FOR_FITTING: {
      title: 'Ready for Fitting',
      smsTemplate: SMS_TEMPLATES.orderReadyForFitting(orderNumber, clientName),
    },
    COMPLETED: {
      title: 'Order Completed',
      smsTemplate: SMS_TEMPLATES.orderCompleted(orderNumber, clientName),
    },
  };

  const config = statusMessages[newStatus];
  if (!config) return;

  await createNotification({
    userId: tailorId,
    type: 'ORDER_UPDATE',
    title: config.title,
    message: `Order ${orderNumber} for ${clientName} is now ${newStatus.toLowerCase().replace('_', ' ')}`,
    data: { orderNumber, clientName, status: newStatus },
    sendSms: notifySms && !!clientPhone,
    smsRecipient: clientPhone || undefined,
    sendEmail: notifyEmail && !!clientEmail,
    emailRecipient: clientEmail || undefined,
  });

  // Send Email directly to client with professional template
  if (notifyEmail && clientEmail) {
    await sendOrderStatusEmail(
      clientEmail,
      clientName,
      orderNumber,
      newStatus,
      `Your order ${orderNumber} is now ${newStatus.toLowerCase().replace(/_/g, ' ')}.`
    );
  }

  // Also send SMS directly to client
  if (notifySms && clientPhone) {
    await sendSMS(clientPhone, config.smsTemplate);
  }
}

export async function notifyPaymentReceived(
  tailorId: string,
  clientPhone: string | null,
  clientEmail: string | null,
  clientName: string,
  amount: string,
  notifySms: boolean,
  notifyEmail: boolean
): Promise<void> {
  await createNotification({
    userId: tailorId,
    type: 'PAYMENT_RECEIVED',
    priority: 'HIGH',
    title: 'Payment Received',
    message: `${clientName} paid ${amount}`,
    data: { clientName, amount },
    sendSms: notifySms && !!clientPhone,
    smsRecipient: clientPhone || undefined,
    sendEmail: notifyEmail && !!clientEmail,
    emailRecipient: clientEmail || undefined,
  });

  // Send confirmation to client
  if (notifySms && clientPhone) {
    await sendSMS(clientPhone, SMS_TEMPLATES.paymentReceived(amount, clientName));
  }

  // Send Receipt Email
  if (notifyEmail && clientEmail) {
    // Generate a temporary receipt URL (in real app, this would be a signed URL or PDF link)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const receiptUrl = `${baseUrl}/studio/payments`;

    // We don't have payment number here easily, so we might need to adjust signature or fetch it
    // For now, using a placeholder or we can pass it in 'data'
    // Better yet, let's update the signature of this function in a separate step or just use "VIEW"
    await sendReceiptEmail(clientEmail, clientName, 'VIEW', amount, receiptUrl);
  }
}

export async function notifyNewClient(tailorId: string, clientName: string): Promise<void> {
  await createNotification({
    userId: tailorId,
    type: 'NEW_CLIENT',
    title: 'New Client Added',
    message: `${clientName} has been added to your client list`,
    data: { clientName },
  });
}

export async function notifyNewMessage(
  tailorId: string,
  clientName: string,
  orderNumber: string
): Promise<void> {
  await createNotification({
    userId: tailorId,
    type: 'NEW_MESSAGE',
    priority: 'HIGH',
    title: 'New Message',
    message: `${clientName} sent a message about order ${orderNumber}`,
    data: { clientName, orderNumber },
  });
}

export async function notifyApproachingDeadline(
  tailorId: string,
  orderNumber: string,
  clientName: string,
  deadline: Date
): Promise<void> {
  const daysDiff = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const priority: NotificationPriority = daysDiff <= 1 ? 'URGENT' : 'HIGH';

  await createNotification({
    userId: tailorId,
    type: 'ORDER_UPDATE',
    priority,
    title: 'Deadline Approaching',
    message: `Order ${orderNumber} for ${clientName} is due in ${daysDiff} day(s).`,
    data: { orderNumber, clientName, daysRemaining: daysDiff },
  });
}

export async function notifyAppointmentReminder(
  tailorId: string,
  clientId: string,
  clientPhone: string,
  clientName: string,
  appointmentType: string,
  startTime: Date,
  clientEmail?: string | null
): Promise<void> {
  const timeStr = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const _dateStr = startTime.toLocaleDateString();

  // Notify Tailor
  await createNotification({
    userId: tailorId,
    type: 'APPOINTMENT_REMINDER',
    priority: 'MEDIUM',
    title: 'Appointment Reminder',
    message: `Upcoming ${appointmentType.toLowerCase()} with ${clientName} at ${timeStr} today.`,
    data: { clientId, clientName, appointmentType, startTime },
  });

  // SMS to Client
  const smsMessage = `Hi ${clientName}! Just a reminder of your ${appointmentType.toLowerCase()} appointment with StitchCraft today at ${timeStr}. We look forward to seeing you!`;
  await sendSMS(clientPhone, smsMessage);

  // Email to Client
  if (clientEmail) {
    await sendAppointmentReminderEmail(clientEmail, clientName, appointmentType, timeStr);
  }
}

export async function notifyAppointmentCreated(
  tailorId: string,
  clientPhone: string | null,
  clientEmail: string | null,
  clientName: string,
  appointmentType: string,
  startTime: Date,
  location?: string,
  notes?: string
): Promise<void> {
  const dateStr = startTime.toLocaleDateString();
  const timeStr = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // In-app notification for Tailor
  await createNotification({
    userId: tailorId,
    type: 'SYSTEM',
    priority: 'MEDIUM',
    title: 'New Appointment',
    message: `Appointment scheduled with ${clientName} for ${appointmentType} on ${dateStr} at ${timeStr}.`,
    data: { clientName, appointmentType, dateStr, timeStr },
  });

  // SMS to Client
  if (clientPhone) {
    const smsMessage = `Hi ${clientName}, your ${appointmentType} appointment with StitchCraft is confirmed for ${dateStr} at ${timeStr}. See you then!`;
    await sendSMS(clientPhone, smsMessage);
  }

  // Email to Client
  if (clientEmail) {
    await sendAppointmentConfirmationEmail(
      clientEmail,
      clientName,
      appointmentType,
      dateStr,
      timeStr,
      location,
      notes
    );
  }
}

export async function notifyInvoiceSent(
  tailorId: string,
  clientPhone: string | null,
  clientEmail: string | null,
  clientName: string,
  invoiceNumber: string,
  amount: string
): Promise<void> {
  // In-app notification (audit trail)
  await createNotification({
    userId: tailorId,
    type: 'SYSTEM', // Or a new type INVOICE_SENT
    title: 'Invoice Sent',
    message: `Invoice ${invoiceNumber} sent to ${clientName} (${amount})`,
    data: { invoiceNumber, clientName, amount },
  });

  // SMS
  if (clientPhone) {
    const smsMessage = `Hi ${clientName}, invoice ${invoiceNumber} for ${amount} has been sent. Please check your email or portal. Thanks, StitchCraft.`;
    await sendSMS(clientPhone, smsMessage);
  }

  // Email
  if (clientEmail) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const invoiceUrl = `${baseUrl}/studio/invoices`; // Or specific link
    await sendInvoiceEmail(clientEmail, clientName, invoiceNumber, amount, invoiceUrl);
  }
}

export async function notifyLowInventory(
  tailorId: string,
  itemName: string,
  currentQuantity: number,
  minQuantity: number
): Promise<void> {
  await createNotification({
    userId: tailorId,
    type: 'SYSTEM',
    priority: 'HIGH',
    title: 'Low Stock Alert',
    message: `Material "${itemName}" is low. Only ${currentQuantity} left (Min: ${minQuantity}).`,
    data: { itemName, currentQuantity, minQuantity },
  });
}
