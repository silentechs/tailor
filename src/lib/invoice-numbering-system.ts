import prisma from './prisma';

// ============================================
// Invoice Numbering System
// Sequential numbering with year/month prefix
// ============================================

interface NumberingConfig {
  prefix: string;
  yearFormat: 'full' | 'short'; // 2024 vs 24
  includeMonth: boolean;
  separator: string;
  padLength: number;
}

const DEFAULT_CONFIG: NumberingConfig = {
  prefix: 'INV',
  yearFormat: 'short',
  includeMonth: true,
  separator: '-',
  padLength: 4,
};

// ============================================
// Generate Sequential Invoice Number
// ============================================

export async function generateInvoiceNumber(
  tailorId: string,
  config?: Partial<NumberingConfig>
): Promise<string> {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  const now = new Date();
  const year = cfg.yearFormat === 'full' ? now.getFullYear() : now.getFullYear() % 100;
  const month = (now.getMonth() + 1).toString().padStart(2, '0');

  // Build the prefix pattern for counting
  const yearStr = year.toString().padStart(cfg.yearFormat === 'full' ? 4 : 2, '0');
  const periodPrefix = cfg.includeMonth
    ? `${cfg.prefix}${cfg.separator}${yearStr}${month}`
    : `${cfg.prefix}${cfg.separator}${yearStr}`;

  // Count existing invoices for this tailor in this period
  const count = await prisma.invoice.count({
    where: {
      tailorId,
      invoiceNumber: {
        startsWith: periodPrefix,
      },
    },
  });

  const sequenceNumber = (count + 1).toString().padStart(cfg.padLength, '0');

  return `${periodPrefix}${cfg.separator}${sequenceNumber}`;
}

// ============================================
// Generate Order Number
// ============================================

export async function generateOrderNumber(tailorId: string): Promise<string> {
  const now = new Date();
  const year = now.getFullYear() % 100;
  const month = (now.getMonth() + 1).toString().padStart(2, '0');

  const prefix = `SC-${year}${month}`;

  // Find the highest existing order number with this prefix
  const latestOrder = await prisma.order.findFirst({
    where: {
      tailorId,
      orderNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      orderNumber: 'desc',
    },
    select: {
      orderNumber: true,
    },
  });

  let nextSequence = 1;

  if (latestOrder?.orderNumber) {
    // Extract the sequence number from the latest order
    const match = latestOrder.orderNumber.match(/-(\d{4,})$/);
    if (match) {
      nextSequence = parseInt(match[1], 10) + 1;
    }
  }

  // Add a small random suffix to handle race conditions (last 3 chars of timestamp)
  const randomSuffix = Date.now().toString().slice(-3);
  const sequenceNumber = nextSequence.toString().padStart(4, '0');

  return `${prefix}-${sequenceNumber}${randomSuffix}`;
}

// ============================================
// Generate Payment Number
// ============================================

export async function generatePaymentNumber(tailorId: string): Promise<string> {
  const now = new Date();
  const year = now.getFullYear() % 100;
  const month = (now.getMonth() + 1).toString().padStart(2, '0');

  const prefix = `PAY-${year}${month}`;

  // Find the highest existing payment number with this prefix
  const latestPayment = await prisma.payment.findFirst({
    where: {
      tailorId,
      paymentNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      paymentNumber: 'desc',
    },
    select: {
      paymentNumber: true,
    },
  });

  let nextSequence = 1;

  if (latestPayment?.paymentNumber) {
    // Extract the sequence number from the latest payment (before the random suffix)
    // Pattern: PAY-YYMM-XXXX or PAY-YYMM-XXXXNNN (with random suffix)
    const match = latestPayment.paymentNumber.match(/-(\d{4,})$/);
    if (match) {
      // Get the first 4 digits as sequence, ignore any random suffix
      const fullSequence = match[1];
      const baseSequence = parseInt(fullSequence.slice(0, 4), 10);
      nextSequence = baseSequence + 1;
    }
  }

  // Add a small random suffix to handle race conditions (last 3 chars of timestamp)
  const randomSuffix = Date.now().toString().slice(-3);
  const sequenceNumber = nextSequence.toString().padStart(4, '0');

  return `${prefix}-${sequenceNumber}${randomSuffix}`;
}

// ============================================
// Parse Invoice Number
// ============================================

export function parseInvoiceNumber(invoiceNumber: string): {
  prefix: string;
  year: number;
  month?: number;
  sequence: number;
} | null {
  // Pattern: INV-YYMM-XXXX or INV-YY-XXXX
  const withMonthMatch = invoiceNumber.match(/^([A-Z]+)-(\d{2})(\d{2})-(\d+)$/);
  if (withMonthMatch) {
    return {
      prefix: withMonthMatch[1],
      year: parseInt(withMonthMatch[2], 10),
      month: parseInt(withMonthMatch[3], 10),
      sequence: parseInt(withMonthMatch[4], 10),
    };
  }

  const withoutMonthMatch = invoiceNumber.match(/^([A-Z]+)-(\d{2})-(\d+)$/);
  if (withoutMonthMatch) {
    return {
      prefix: withoutMonthMatch[1],
      year: parseInt(withoutMonthMatch[2], 10),
      sequence: parseInt(withoutMonthMatch[3], 10),
    };
  }

  return null;
}

// ============================================
// Validate Invoice Number Format
// ============================================

export function isValidInvoiceNumber(invoiceNumber: string): boolean {
  return parseInvoiceNumber(invoiceNumber) !== null;
}

// ============================================
// Get Next Sequence Preview
// ============================================

export async function previewNextNumbers(tailorId: string): Promise<{
  nextInvoice: string;
  nextOrder: string;
  nextPayment: string;
}> {
  const [nextInvoice, nextOrder, nextPayment] = await Promise.all([
    generateInvoiceNumber(tailorId),
    generateOrderNumber(tailorId),
    generatePaymentNumber(tailorId),
  ]);

  return {
    nextInvoice,
    nextOrder,
    nextPayment,
  };
}
