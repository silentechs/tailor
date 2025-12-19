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

  const count = await prisma.order.count({
    where: {
      tailorId,
      orderNumber: {
        startsWith: prefix,
      },
    },
  });

  const sequenceNumber = (count + 1).toString().padStart(4, '0');

  return `${prefix}-${sequenceNumber}`;
}

// ============================================
// Generate Payment Number
// ============================================

export async function generatePaymentNumber(tailorId: string): Promise<string> {
  const now = new Date();
  const year = now.getFullYear() % 100;
  const month = (now.getMonth() + 1).toString().padStart(2, '0');

  const prefix = `PAY-${year}${month}`;

  const count = await prisma.payment.count({
    where: {
      tailorId,
      paymentNumber: {
        startsWith: prefix,
      },
    },
  });

  const sequenceNumber = (count + 1).toString().padStart(4, '0');

  return `${prefix}-${sequenceNumber}`;
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
