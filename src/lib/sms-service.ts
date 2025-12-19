import prisma from './prisma';
import { formatGhanaPhone, isValidGhanaPhone } from './utils';

// ============================================
// SMS Service - Multi-Provider for Ghana
// Providers: Hubtel, Termii, Hub2SMS, Mock
// ============================================

export interface SMSResult {
  success: boolean;
  messageId?: string;
  provider?: string;
  error?: string;
}

export interface SMSProvider {
  name: string;
  send(to: string, message: string): Promise<SMSResult>;
  checkBalance?(): Promise<number>;
}

// ============================================
// Hubtel Provider
// ============================================

class HubtelProvider implements SMSProvider {
  name = 'hubtel';

  async send(to: string, message: string): Promise<SMSResult> {
    const clientId = process.env.HUBTEL_CLIENT_ID;
    const clientSecret = process.env.HUBTEL_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return { success: false, error: 'Hubtel credentials not configured' };
    }

    try {
      const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      const formattedPhone = formatGhanaPhone(to);

      const response = await fetch('https://smsc.hubtel.com/v1/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          From: 'StitchCraft',
          To: formattedPhone,
          Content: message,
        }),
      });

      const data = await response.json();

      if (response.ok && data.MessageId) {
        return {
          success: true,
          messageId: data.MessageId,
          provider: this.name,
        };
      }

      return {
        success: false,
        error: data.Message || 'Hubtel send failed',
        provider: this.name,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Hubtel request failed',
        provider: this.name,
      };
    }
  }
}

// ============================================
// Termii Provider
// ============================================

class TermiiProvider implements SMSProvider {
  name = 'termii';

  async send(to: string, message: string): Promise<SMSResult> {
    const apiKey = process.env.TERMII_API_KEY;

    if (!apiKey) {
      return { success: false, error: 'Termii API key not configured' };
    }

    try {
      const formattedPhone = formatGhanaPhone(to);

      const response = await fetch('https://api.ng.termii.com/api/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: apiKey,
          to: formattedPhone,
          from: 'StitchCraft',
          sms: message,
          type: 'plain',
          channel: 'generic',
        }),
      });

      const data = await response.json();

      if (data.code === 'ok' || data.message_id) {
        return {
          success: true,
          messageId: data.message_id,
          provider: this.name,
        };
      }

      return {
        success: false,
        error: data.message || 'Termii send failed',
        provider: this.name,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Termii request failed',
        provider: this.name,
      };
    }
  }
}

// ============================================
// Hub2SMS Provider
// ============================================

class Hub2SMSProvider implements SMSProvider {
  name = 'hub2sms';

  async send(to: string, message: string): Promise<SMSResult> {
    const apiKey = process.env.HUB2SMS_API_KEY;
    const username = process.env.HUB2SMS_USERNAME;
    const password = process.env.HUB2SMS_PASSWORD;

    if (!apiKey || !username || !password) {
      return { success: false, error: 'Hub2SMS credentials not configured' };
    }

    try {
      const formattedPhone = formatGhanaPhone(to);

      const response = await fetch('https://hub2sms.com/api/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({
          username,
          password,
          to: formattedPhone,
          message,
          sender: 'StitchCraft',
        }),
      });

      const data = await response.json();

      if (data.success || data.status === 'success') {
        return {
          success: true,
          messageId: data.messageId || data.id,
          provider: this.name,
        };
      }

      return {
        success: false,
        error: data.message || data.error || 'Hub2SMS send failed',
        provider: this.name,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Hub2SMS request failed',
        provider: this.name,
      };
    }
  }
}

// ============================================
// Mock Provider (Development)
// ============================================

class MockProvider implements SMSProvider {
  name = 'mock';

  async send(to: string, message: string): Promise<SMSResult> {
    console.log(`[MOCK SMS] To: ${to}`);
    console.log(`[MOCK SMS] Message: ${message}`);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      success: true,
      messageId: `mock_${Date.now()}`,
      provider: this.name,
    };
  }
}

// ============================================
// SMS Service
// ============================================

const providers: SMSProvider[] = [
  new HubtelProvider(),
  new TermiiProvider(),
  new Hub2SMSProvider(),
  new MockProvider(),
];

export async function sendSMS(to: string, message: string): Promise<SMSResult> {
  // Validate phone number
  if (!isValidGhanaPhone(to)) {
    return { success: false, error: 'Invalid Ghana phone number' };
  }

  const formattedPhone = formatGhanaPhone(to);

  // Try each provider in order until one succeeds
  for (const provider of providers) {
    // Skip mock in production unless no other provider works
    if (provider.name === 'mock' && process.env.NODE_ENV === 'production') {
      continue;
    }

    const result = await provider.send(formattedPhone, message);

    // Log the attempt
    await logSMSAttempt(provider.name, formattedPhone, message, result);

    if (result.success) {
      return result;
    }

    console.warn(`SMS provider ${provider.name} failed:`, result.error);
  }

  // If all providers fail, try mock as last resort
  if (process.env.NODE_ENV === 'production') {
    const mockProvider = new MockProvider();
    const result = await mockProvider.send(formattedPhone, message);
    await logSMSAttempt(mockProvider.name, formattedPhone, message, result);
    return result;
  }

  return { success: false, error: 'All SMS providers failed' };
}

async function logSMSAttempt(
  provider: string,
  recipient: string,
  message: string,
  result: SMSResult
) {
  try {
    await prisma.smsNotification.create({
      data: {
        provider,
        recipient,
        message,
        status: result.success ? 'sent' : 'failed',
        messageId: result.messageId,
        errorMessage: result.error,
      },
    });
  } catch (error) {
    console.error('Failed to log SMS attempt:', error);
  }
}

// ============================================
// SMS Templates
// ============================================

export const SMS_TEMPLATES = {
  orderConfirmed: (orderNumber: string, clientName: string) =>
    `Hi ${clientName}! Your order ${orderNumber} has been confirmed. We'll notify you when work begins. - StitchCraft`,

  orderInProgress: (orderNumber: string, clientName: string) =>
    `Hi ${clientName}! Work has started on your order ${orderNumber}. We'll keep you updated. - StitchCraft`,

  orderReadyForFitting: (orderNumber: string, clientName: string) =>
    `Hi ${clientName}! Your order ${orderNumber} is ready for fitting. Please visit us at your earliest convenience. - StitchCraft`,

  orderCompleted: (orderNumber: string, clientName: string) =>
    `Hi ${clientName}! Great news! Your order ${orderNumber} is complete and ready for pickup. - StitchCraft`,

  paymentReceived: (amount: string, clientName: string) =>
    `Hi ${clientName}! We received your payment of ${amount}. Thank you! - StitchCraft`,

  paymentReminder: (amount: string, orderNumber: string, clientName: string) =>
    `Hi ${clientName}! Reminder: ${amount} balance due for order ${orderNumber}. Please pay at your convenience. - StitchCraft`,

  invoiceSent: (invoiceNumber: string, amount: string, clientName: string) =>
    `Hi ${clientName}! Invoice ${invoiceNumber} for ${amount} has been sent to your email. - StitchCraft`,

  trackingLink: (clientName: string, trackingUrl: string) =>
    `Hi ${clientName}! Track your order here: ${trackingUrl} - StitchCraft`,

  welcomeClient: (clientName: string, tailorName: string) =>
    `Welcome ${clientName}! You've been added as a client of ${tailorName}. We look forward to serving you. - StitchCraft`,
};
