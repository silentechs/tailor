// ============================================
// Ghana Invoice Tax Calculations
// VAT: 15%, NHIL: 2.5%, GETFUND: 2.5%
// Total effective tax rate: 20%
// ============================================

export const TAX_RATES = {
  VAT: 0.15, // 15% Value Added Tax
  NHIL: 0.025, // 2.5% National Health Insurance Levy
  GETFUND: 0.025, // 2.5% Ghana Education Trust Fund
} as const;

export const TOTAL_TAX_RATE = TAX_RATES.VAT + TAX_RATES.NHIL + TAX_RATES.GETFUND; // 20%

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface InvoiceCalculation {
  items: InvoiceLineItem[];
  subtotal: number;
  vatAmount: number;
  nhilAmount: number;
  getfundAmount: number;
  totalTax: number;
  totalAmount: number;
}

export function calculateLineItemAmount(quantity: number, unitPrice: number): number {
  return roundCurrency(quantity * unitPrice);
}

export function calculateSubtotal(items: InvoiceLineItem[]): number {
  return roundCurrency(items.reduce((sum, item) => sum + item.amount, 0));
}

export function calculateVAT(subtotal: number): number {
  return roundCurrency(subtotal * TAX_RATES.VAT);
}

export function calculateNHIL(subtotal: number): number {
  return roundCurrency(subtotal * TAX_RATES.NHIL);
}

export function calculateGETFUND(subtotal: number): number {
  return roundCurrency(subtotal * TAX_RATES.GETFUND);
}

export function calculateTotalTax(subtotal: number): number {
  return roundCurrency(subtotal * TOTAL_TAX_RATE);
}

export function calculateInvoiceTotal(subtotal: number): number {
  return roundCurrency(subtotal * (1 + TOTAL_TAX_RATE));
}

export function calculateInvoice(items: InvoiceLineItem[]): InvoiceCalculation {
  const subtotal = calculateSubtotal(items);
  const vatAmount = calculateVAT(subtotal);
  const nhilAmount = calculateNHIL(subtotal);
  const getfundAmount = calculateGETFUND(subtotal);
  const totalTax = vatAmount + nhilAmount + getfundAmount;
  const totalAmount = subtotal + totalTax;

  return {
    items,
    subtotal: roundCurrency(subtotal),
    vatAmount: roundCurrency(vatAmount),
    nhilAmount: roundCurrency(nhilAmount),
    getfundAmount: roundCurrency(getfundAmount),
    totalTax: roundCurrency(totalTax),
    totalAmount: roundCurrency(totalAmount),
  };
}

// Round to 2 decimal places (Ghana Cedis)
function roundCurrency(amount: number): number {
  return Math.round(amount * 100) / 100;
}

// Calculate reverse tax (from gross to net)
export function calculateReverseVAT(grossAmount: number): number {
  return roundCurrency(grossAmount / (1 + TOTAL_TAX_RATE));
}

// Format tax breakdown for display
export function formatTaxBreakdown(calculation: InvoiceCalculation): string[] {
  return [
    `Subtotal: GH₵ ${calculation.subtotal.toFixed(2)}`,
    `VAT (15%): GH₵ ${calculation.vatAmount.toFixed(2)}`,
    `NHIL (2.5%): GH₵ ${calculation.nhilAmount.toFixed(2)}`,
    `GETFUND (2.5%): GH₵ ${calculation.getfundAmount.toFixed(2)}`,
    `Total: GH₵ ${calculation.totalAmount.toFixed(2)}`,
  ];
}

// Check if invoice is overdue
export function isInvoiceOverdue(dueDate: Date | null | undefined): boolean {
  if (!dueDate) return false;
  return new Date() > new Date(dueDate);
}

// Calculate days until due or days overdue
export function getDaysUntilDue(dueDate: Date | null | undefined): number | null {
  if (!dueDate) return null;

  const now = new Date();
  const due = new Date(dueDate);
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}
