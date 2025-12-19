import { jsPDF } from 'jspdf';

interface InvoiceItem {
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
}

interface InvoiceData {
    invoiceNumber: string;
    createdAt: string | Date;
    dueDate?: string | Date | null;
    status: string;

    // Business info
    businessName: string;
    businessAddress?: string;
    businessPhone?: string;
    businessEmail?: string;
    businessRegion?: string;
    businessCity?: string;

    // Client info
    clientName: string;
    clientPhone?: string;
    clientEmail?: string;
    clientAddress?: string;

    // Items and totals
    items: InvoiceItem[];
    subtotal: number;
    vatAmount: number;
    nhilAmount: number;
    getfundAmount: number;
    totalAmount: number;
    paidAmount?: number;

    // Optional
    notes?: string;
    termsConditions?: string;
    orderNumber?: string;
}

const formatCurrency = (amount: number): string => {
    return `GHS ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

const formatDate = (date: string | Date): string => {
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

export function generateInvoicePDF(invoice: InvoiceData): jsPDF {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPos = 20;

    // Colors (Ghana theme)
    const primaryColor = '#006B3F'; // Ghana Green
    const accentColor = '#CE1126';  // Ghana Red
    const goldColor = '#FCD116';    // Ghana Gold
    const textColor = '#333333';
    const lightGray = '#f5f5f5';

    // Header with Ghana flag colors bar
    doc.setFillColor(206, 17, 38); // Red
    doc.rect(0, 0, pageWidth / 3, 3, 'F');
    doc.setFillColor(252, 209, 22); // Gold
    doc.rect(pageWidth / 3, 0, pageWidth / 3, 3, 'F');
    doc.setFillColor(0, 107, 63); // Green
    doc.rect((pageWidth / 3) * 2, 0, pageWidth / 3, 3, 'F');

    yPos = 15;

    // Business name / Logo area
    doc.setFontSize(24);
    doc.setTextColor(0, 107, 63);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.businessName || 'StitchCraft Ghana', margin, yPos);

    yPos += 8;
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');

    const businessDetails = [];
    if (invoice.businessAddress) businessDetails.push(invoice.businessAddress);
    if (invoice.businessCity && invoice.businessRegion) {
        businessDetails.push(`${invoice.businessCity}, ${invoice.businessRegion.replace(/_/g, ' ')}`);
    }
    if (invoice.businessPhone) businessDetails.push(`Tel: ${invoice.businessPhone}`);
    if (invoice.businessEmail) businessDetails.push(invoice.businessEmail);

    businessDetails.forEach((line) => {
        doc.text(line, margin, yPos);
        yPos += 5;
    });

    // Invoice title and number (right aligned)
    doc.setFontSize(28);
    doc.setTextColor(0, 107, 63);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', pageWidth - margin, 20, { align: 'right' });

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    doc.text(`#${invoice.invoiceNumber}`, pageWidth - margin, 28, { align: 'right' });

    // Status badge
    const statusColors: Record<string, string> = {
        DRAFT: '#6b7280',
        SENT: '#3b82f6',
        VIEWED: '#8b5cf6',
        PAID: '#10b981',
        OVERDUE: '#ef4444',
        CANCELLED: '#6b7280',
    };

    doc.setFontSize(9);
    doc.setTextColor(255);
    doc.setFillColor(statusColors[invoice.status] || '#6b7280');
    const statusText = invoice.status;
    const statusWidth = doc.getTextWidth(statusText) + 10;
    doc.roundedRect(pageWidth - margin - statusWidth, 32, statusWidth, 7, 2, 2, 'F');
    doc.text(statusText, pageWidth - margin - statusWidth / 2, 37, { align: 'center' });

    yPos = 55;

    // Divider
    doc.setDrawColor(230);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // Bill To and Invoice Details side by side
    const colWidth = (pageWidth - margin * 2) / 2;

    // Bill To
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO', margin, yPos);

    // Invoice Details
    doc.text('INVOICE DETAILS', margin + colWidth, yPos);

    yPos += 7;
    doc.setTextColor(50);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(invoice.clientName, margin, yPos);

    yPos += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    if (invoice.clientPhone) {
        doc.text(invoice.clientPhone, margin, yPos);
        yPos += 5;
    }
    if (invoice.clientEmail) {
        doc.text(invoice.clientEmail, margin, yPos);
        yPos += 5;
    }
    if (invoice.clientAddress) {
        doc.text(invoice.clientAddress, margin, yPos);
    }

    // Invoice details (right column)
    let detailY = yPos - 13;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    doc.text('Invoice Date:', margin + colWidth, detailY);
    doc.text(formatDate(invoice.createdAt), pageWidth - margin, detailY, { align: 'right' });
    detailY += 6;

    if (invoice.dueDate) {
        doc.text('Due Date:', margin + colWidth, detailY);
        doc.text(formatDate(invoice.dueDate), pageWidth - margin, detailY, { align: 'right' });
        detailY += 6;
    }

    if (invoice.orderNumber) {
        doc.text('Order:', margin + colWidth, detailY);
        doc.text(`#${invoice.orderNumber}`, pageWidth - margin, detailY, { align: 'right' });
    }

    yPos = Math.max(yPos, detailY) + 15;

    // Items table header
    doc.setFillColor(0, 107, 63);
    doc.rect(margin, yPos, pageWidth - margin * 2, 10, 'F');

    doc.setTextColor(255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);

    const col1 = margin + 3;
    const col2 = margin + 90;
    const col3 = margin + 115;
    const col4 = pageWidth - margin - 3;

    yPos += 7;
    doc.text('Description', col1, yPos);
    doc.text('Qty', col2, yPos);
    doc.text('Unit Price', col3, yPos);
    doc.text('Amount', col4, yPos, { align: 'right' });

    yPos += 8;

    // Items
    doc.setTextColor(50);
    doc.setFont('helvetica', 'normal');

    const items = (invoice.items as InvoiceItem[]) || [];
    items.forEach((item, index) => {
        if (index % 2 === 0) {
            doc.setFillColor(250, 250, 250);
            doc.rect(margin, yPos - 5, pageWidth - margin * 2, 10, 'F');
        }

        doc.text(item.description || '', col1, yPos);
        doc.text(String(item.quantity), col2, yPos);
        doc.text(formatCurrency(item.unitPrice), col3, yPos);
        doc.text(formatCurrency(item.amount), col4, yPos, { align: 'right' });
        yPos += 10;
    });

    yPos += 5;

    // Totals section
    const totalsX = pageWidth - margin - 80;
    doc.setDrawColor(230);
    doc.line(totalsX, yPos, pageWidth - margin, yPos);
    yPos += 8;

    // Subtotal
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', totalsX, yPos);
    doc.text(formatCurrency(invoice.subtotal), pageWidth - margin, yPos, { align: 'right' });
    yPos += 7;

    // VAT
    doc.setTextColor(100);
    doc.text('VAT (15%):', totalsX, yPos);
    doc.text(formatCurrency(invoice.vatAmount), pageWidth - margin, yPos, { align: 'right' });
    yPos += 6;

    // NHIL
    doc.text('NHIL (2.5%):', totalsX, yPos);
    doc.text(formatCurrency(invoice.nhilAmount), pageWidth - margin, yPos, { align: 'right' });
    yPos += 6;

    // GETFUND
    doc.text('GETFUND (2.5%):', totalsX, yPos);
    doc.text(formatCurrency(invoice.getfundAmount), pageWidth - margin, yPos, { align: 'right' });
    yPos += 8;

    // Total
    doc.setDrawColor(0, 107, 63);
    doc.setLineWidth(0.5);
    doc.line(totalsX, yPos, pageWidth - margin, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0, 107, 63);
    doc.text('TOTAL:', totalsX, yPos);
    doc.text(formatCurrency(invoice.totalAmount), pageWidth - margin, yPos, { align: 'right' });
    yPos += 10;

    // Paid amount and balance if applicable
    const paidAmount = invoice.paidAmount || 0;
    if (paidAmount > 0) {
        doc.setFontSize(10);
        doc.setTextColor(16, 185, 129); // Green
        doc.text('Paid:', totalsX, yPos);
        doc.text(formatCurrency(paidAmount), pageWidth - margin, yPos, { align: 'right' });
        yPos += 7;

        const balance = invoice.totalAmount - paidAmount;
        if (balance > 0) {
            doc.setTextColor(239, 68, 68); // Red
            doc.setFont('helvetica', 'bold');
            doc.text('Balance Due:', totalsX, yPos);
            doc.text(formatCurrency(balance), pageWidth - margin, yPos, { align: 'right' });
        }
    }

    yPos += 15;

    // Notes section
    if (invoice.notes) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(50);
        doc.text('Notes:', margin, yPos);
        yPos += 6;

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100);
        const noteLines = doc.splitTextToSize(invoice.notes, pageWidth - margin * 2);
        doc.text(noteLines, margin, yPos);
        yPos += noteLines.length * 5 + 10;
    }

    // Terms section
    if (invoice.termsConditions) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(50);
        doc.text('Terms & Conditions:', margin, yPos);
        yPos += 6;

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100);
        doc.setFontSize(9);
        const termsLines = doc.splitTextToSize(invoice.termsConditions, pageWidth - margin * 2);
        doc.text(termsLines, margin, yPos);
    }

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 15;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('Thank you for your business!', pageWidth / 2, footerY - 5, { align: 'center' });
    doc.text('Powered by StitchCraft Ghana', pageWidth / 2, footerY, { align: 'center' });

    return doc;
}

export function downloadInvoicePDF(invoice: InvoiceData, filename?: string): void {
    const doc = generateInvoicePDF(invoice);
    doc.save(filename || `invoice-${invoice.invoiceNumber}.pdf`);
}

export function getInvoicePDFBlob(invoice: InvoiceData): Blob {
    const doc = generateInvoicePDF(invoice);
    return doc.output('blob');
}

export function getInvoicePDFBase64(invoice: InvoiceData): string {
    const doc = generateInvoicePDF(invoice);
    return doc.output('datauristring');
}
