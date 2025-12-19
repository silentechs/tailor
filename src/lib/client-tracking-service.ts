import prisma from './prisma';
import { generateTrackingToken } from './utils';

// ============================================
// Client Tracking Service
// Secure QR code access for clients
// ============================================

export interface TrackingTokenResult {
  token: string;
  url: string;
  qrData: string;
}

// ============================================
// Token Management
// ============================================

export async function createTrackingToken(clientId: string): Promise<TrackingTokenResult> {
  // Deactivate any existing active tokens
  await prisma.clientTrackingToken.updateMany({
    where: {
      clientId,
      isActive: true,
    },
    data: {
      isActive: false,
    },
  });

  // Create new token
  const token = generateTrackingToken();
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 6); // 6 months expiry

  await prisma.clientTrackingToken.create({
    data: {
      clientId,
      token,
      expiresAt,
    },
  });

  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const url = `${appUrl}/track/${token}`;

  return {
    token,
    url,
    qrData: url,
  };
}

export async function validateTrackingToken(token: string) {
  const trackingToken = await prisma.clientTrackingToken.findUnique({
    where: { token },
    include: {
      client: {
        include: {
          tailor: {
            select: {
              id: true,
              name: true,
              businessName: true,
              phone: true,
              email: true,
              profileImage: true,
            },
          },
        },
      },
    },
  });

  if (!trackingToken) {
    return { valid: false, error: 'Invalid tracking token' };
  }

  if (!trackingToken.isActive) {
    return { valid: false, error: 'Token has been deactivated' };
  }

  if (trackingToken.expiresAt && trackingToken.expiresAt < new Date()) {
    return { valid: false, error: 'Token has expired' };
  }

  // Update last used timestamp
  await prisma.clientTrackingToken.update({
    where: { id: trackingToken.id },
    data: { lastUsedAt: new Date() },
  });

  return {
    valid: true,
    client: trackingToken.client,
    tailor: trackingToken.client.tailor,
  };
}

// ============================================
// Client Session Management
// ============================================

export async function createClientSession(trackingTokenId: string, phone: string): Promise<string> {
  const sessionToken = generateTrackingToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

  await prisma.clientSession.create({
    data: {
      trackingTokenId,
      sessionToken,
      phone,
      verified: true,
      expiresAt,
    },
  });

  return sessionToken;
}

export async function validateClientSession(sessionToken: string) {
  const session = await prisma.clientSession.findUnique({
    where: { sessionToken },
    include: {
      trackingToken: {
        include: {
          client: true,
        },
      },
    },
  });

  if (!session) {
    return { valid: false, error: 'Invalid session' };
  }

  if (session.expiresAt < new Date()) {
    return { valid: false, error: 'Session expired' };
  }

  if (!session.verified) {
    return { valid: false, error: 'Session not verified' };
  }

  return {
    valid: true,
    client: session.trackingToken.client,
  };
}

// ============================================
// Client Portal Data
// ============================================

export async function getClientOrders(clientId: string) {
  return prisma.order.findMany({
    where: { clientId },
    orderBy: { createdAt: 'desc' },
    include: {
      collection: {
        select: {
          id: true,
          name: true,
        },
      },
      ratings: true,
    },
  });
}

export async function getClientPayments(clientId: string) {
  return prisma.payment.findMany({
    where: { clientId },
    orderBy: { paidAt: 'desc' },
  });
}

export async function getClientInvoices(clientId: string) {
  return prisma.invoice.findMany({
    where: { clientId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getOrderMessages(orderId: string) {
  return prisma.orderMessage.findMany({
    where: { orderId },
    orderBy: { createdAt: 'asc' },
  });
}

// ============================================
// Client Actions
// ============================================

export async function sendClientMessage(
  orderId: string,
  message: string,
  _clientPhone: string
): Promise<void> {
  await prisma.orderMessage.create({
    data: {
      orderId,
      senderType: 'client',
      message,
    },
  });

  // Get order to notify tailor
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      client: true,
      tailor: true,
    },
  });

  if (order) {
    // Create notification for tailor (notification will be handled by calling code)
  }
}

export async function submitOrderRating(
  orderId: string,
  rating: number,
  review?: string
): Promise<void> {
  // Check if rating already exists
  const existingRating = await prisma.orderRating.findFirst({
    where: { orderId },
  });

  if (existingRating) {
    await prisma.orderRating.update({
      where: { id: existingRating.id },
      data: { rating, review },
    });
  } else {
    await prisma.orderRating.create({
      data: {
        orderId,
        rating,
        review,
      },
    });
  }
}

export async function submitSocialMediaConsent(
  clientId: string,
  orderId: string | null,
  consented: boolean,
  platforms: string[]
): Promise<void> {
  const existing = await prisma.socialMediaConsent.findFirst({
    where: { clientId, orderId },
  });

  if (existing) {
    await prisma.socialMediaConsent.update({
      where: { id: existing.id },
      data: {
        consented,
        platforms,
        consentedAt: consented ? new Date() : null,
      },
    });
  } else {
    await prisma.socialMediaConsent.create({
      data: {
        clientId,
        orderId,
        consented,
        platforms,
        consentedAt: consented ? new Date() : null,
      },
    });
  }
}

// ============================================
// Order Timeline
// ============================================

export interface TimelineEvent {
  status: string;
  label: string;
  date: Date | null;
  completed: boolean;
  current: boolean;
}

const ORDER_FLOW = [
  { status: 'PENDING', label: 'Order Placed' },
  { status: 'CONFIRMED', label: 'Confirmed' },
  { status: 'IN_PROGRESS', label: 'In Progress' },
  { status: 'READY_FOR_FITTING', label: 'Ready for Fitting' },
  { status: 'FITTING_DONE', label: 'Fitting Complete' },
  { status: 'COMPLETED', label: 'Completed' },
];

export function generateOrderTimeline(order: {
  status: string;
  createdAt: Date;
  startedAt?: Date | null;
  completedAt?: Date | null;
  deliveredAt?: Date | null;
}): TimelineEvent[] {
  const currentIndex = ORDER_FLOW.findIndex((s) => s.status === order.status);

  return ORDER_FLOW.map((step, index) => {
    let date: Date | null = null;

    if (step.status === 'PENDING') date = order.createdAt;
    if (step.status === 'IN_PROGRESS' && order.startedAt) date = order.startedAt;
    if (step.status === 'COMPLETED' && order.completedAt) date = order.completedAt;

    return {
      status: step.status,
      label: step.label,
      date,
      completed: index < currentIndex,
      current: index === currentIndex,
    };
  });
}
