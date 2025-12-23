import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ============================================
// Tailwind Utilities
// ============================================

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================
// Ghana Currency Formatting
// ============================================

const GHANA_LOCALE = 'en-GH';
const GHANA_CURRENCY = 'GHS';

export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return 'GH₵ 0.00';

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (Number.isNaN(numAmount)) return 'GH₵ 0.00';

  return new Intl.NumberFormat(GHANA_LOCALE, {
    style: 'currency',
    currency: GHANA_CURRENCY,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(numAmount)
    .replace('GHS', 'GH₵');
}

export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[GH₵,\s]/g, '');
  return parseFloat(cleaned) || 0;
}

// ============================================
// Ghana Phone Number Validation & Formatting
// ============================================

const GHANA_PHONE_REGEX = /^(?:\+233|0)([235][0-9]{8})$/;

export function isValidGhanaPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s-]/g, '');
  return GHANA_PHONE_REGEX.test(cleaned);
}

export function formatGhanaPhone(phone: string): string {
  const cleaned = phone.replace(/[\s-]/g, '');
  const match = cleaned.match(GHANA_PHONE_REGEX);

  if (!match) return phone;

  return `+233${match[1]}`;
}

export function formatPhoneDisplay(phone: string): string {
  const formatted = formatGhanaPhone(phone);
  if (!formatted.startsWith('+233')) return phone;

  const number = formatted.slice(4);
  return `+233 ${number.slice(0, 2)} ${number.slice(2, 5)} ${number.slice(5)}`;
}

export function getPhoneCarrier(phone: string): string | null {
  const formatted = formatGhanaPhone(phone);
  if (!formatted.startsWith('+233')) return null;

  const prefix = formatted.slice(4, 6);

  // MTN Ghana prefixes
  if (['24', '54', '55', '59'].includes(prefix)) return 'MTN';

  // Vodafone Ghana prefixes
  if (['20', '50'].includes(prefix)) return 'Vodafone';

  // AirtelTigo Ghana prefixes
  if (['26', '27', '56', '57'].includes(prefix)) return 'AirtelTigo';

  return null;
}

// ============================================
// Date & Time Utilities (Ghana Timezone)
// ============================================

const GHANA_TIMEZONE = 'Africa/Accra';

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';

  const d = typeof date === 'string' ? new Date(date) : date;

  return d.toLocaleDateString(GHANA_LOCALE, {
    timeZone: GHANA_TIMEZONE,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-GH', {
    timeZone: 'Africa/Accra',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '';

  const d = typeof date === 'string' ? new Date(date) : date;

  return d.toLocaleString(GHANA_LOCALE, {
    timeZone: GHANA_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return '';

  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return formatDate(d);
}

export function getGhanaTime(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: GHANA_TIMEZONE }));
}

// ============================================
// ID Generation
// ============================================

export function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `SC-${year}${month}-${random}`;
}

export function generateInvoiceNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `INV-${year}${month}-${random}`;
}

export function generatePaymentNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PAY-${year}${month}-${random}`;
}

export function generateTrackingToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// ============================================
// String Utilities
// ============================================

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return `${str.slice(0, length)}...`;
}

export function capitalizeFirst(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ============================================
// Order Status Utilities
// ============================================

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  IN_PROGRESS: 'In Progress',
  READY_FOR_FITTING: 'Ready for Fitting',
  FITTING_DONE: 'Fitting Done',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-purple-100 text-purple-800',
  READY_FOR_FITTING: 'bg-orange-100 text-orange-800',
  FITTING_DONE: 'bg-teal-100 text-teal-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  PARTIAL: 'Partial',
  COMPLETED: 'Paid',
  REFUNDED: 'Refunded',
  FAILED: 'Failed',
};

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PARTIAL: 'bg-orange-100 text-orange-800',
  COMPLETED: 'bg-green-100 text-green-800',
  REFUNDED: 'bg-blue-100 text-blue-800',
  FAILED: 'bg-red-100 text-red-800',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Cash',
  MOBILE_MONEY_MTN: 'MTN Mobile Money',
  MOBILE_MONEY_VODAFONE: 'Vodafone Cash',
  MOBILE_MONEY_AIRTELTIGO: 'AirtelTigo Money',
  BANK_TRANSFER: 'Bank Transfer',
  PAYSTACK: 'Paystack',
};

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  VIEWED: 'Viewed',
  PAID: 'Paid',
  OVERDUE: 'Overdue',
  CANCELLED: 'Cancelled',
};

export const INVOICE_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SENT: 'bg-blue-100 text-blue-800',
  VIEWED: 'bg-purple-100 text-purple-800',
  PAID: 'bg-green-100 text-green-800',
  OVERDUE: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
};

// ============================================
// Garment Type Utilities
// ============================================

export const GARMENT_TYPE_LABELS: Record<string, string> = {
  KABA_AND_SLIT: 'Kaba & Slit',
  DASHIKI: 'Dashiki',
  SMOCK_BATAKARI: 'Smock/Batakari',
  KAFTAN: 'Kaftan',
  AGBADA: 'Agbada',
  COMPLET: 'Complet',
  KENTE_CLOTH: 'Kente Cloth',
  BOUBOU: 'Boubou',
  SUIT: 'Suit',
  DRESS: 'Dress',
  SHIRT: 'Shirt',
  TROUSERS: 'Trousers',
  SKIRT: 'Skirt',
  BLOUSE: 'Blouse',
  OTHER: 'Other',
};

// ============================================
// Region Utilities
// ============================================

export const GHANA_REGIONS: Record<string, string> = {
  GREATER_ACCRA: 'Greater Accra',
  ASHANTI: 'Ashanti',
  WESTERN: 'Western',
  CENTRAL: 'Central',
  EASTERN: 'Eastern',
  VOLTA: 'Volta',
  NORTHERN: 'Northern',
  UPPER_EAST: 'Upper East',
  UPPER_WEST: 'Upper West',
  BONO: 'Bono',
  BONO_EAST: 'Bono East',
  AHAFO: 'Ahafo',
  WESTERN_NORTH: 'Western North',
  OTI: 'Oti',
  NORTH_EAST: 'North East',
  SAVANNAH: 'Savannah',
};

// ============================================
// Appointment Utilities
// ============================================

export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Scheduled',
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No Show',
};

export const APPOINTMENT_STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
  NO_SHOW: 'bg-orange-100 text-orange-800',
};

export const APPOINTMENT_TYPE_LABELS: Record<string, string> = {
  CONSULTATION: 'Consultation',
  MEASUREMENT: 'Measurement',
  FITTING: 'Fitting',
  COLLECTION: 'Collection',
  REPAIR: 'Repair',
};
