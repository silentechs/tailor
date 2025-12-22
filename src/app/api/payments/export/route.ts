import { NextResponse } from 'next/server';
import { requireActiveTailor } from '@/lib/direct-current-user';
import { generateCSV, generateExcelXML } from '@/lib/export-utils';
import prisma from '@/lib/prisma';

// Helper to format payment method
const formatMethod = (method: string) => {
  const labels: Record<string, string> = {
    CASH: 'Cash',
    MOBILE_MONEY_MTN: 'MTN MoMo',
    MOBILE_MONEY_VODAFONE: 'Vodafone Cash',
    MOBILE_MONEY_AIRTELTIGO: 'AirtelTigo Money',
    BANK_TRANSFER: 'Bank Transfer',
    PAYSTACK: 'Paystack',
  };
  return labels[method] || method;
};

// GET /api/payments/export - Export payments as CSV or Excel
export async function GET(request: Request) {
  try {
    const user = await requireActiveTailor();
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';

    const payments = await prisma.payment.findMany({
      where: { tailorId: user.id },
      orderBy: { paidAt: 'desc' },
      include: {
        client: {
          select: { name: true, phone: true },
        },
        order: {
          select: { orderNumber: true },
        },
      },
    });

    // Build data
    const headers = [
      'Payment Number',
      'Date',
      'Client Name',
      'Client Phone',
      'Order Number',
      'Amount (GHS)',
      'Payment Method',
      'Transaction ID',
      'Status',
      'Notes',
    ];

    const rows = payments.map((payment) => [
      payment.paymentNumber,
      new Date(payment.paidAt).toLocaleDateString('en-GB'),
      payment.client.name,
      payment.client.phone,
      payment.order?.orderNumber || '',
      Number(payment.amount).toFixed(2),
      formatMethod(payment.method),
      payment.transactionId || '',
      payment.status,
      payment.notes || '',
    ]);

    const date = new Date().toISOString().split('T')[0];

    if (format === 'xlsx') {
      const xml = generateExcelXML(headers, rows, 'Payments');
      return new NextResponse(xml, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.ms-excel',
          'Content-Disposition': `attachment; filename="payments-${date}.xls"`,
        },
      });
    }

    // Default to CSV
    const csv = generateCSV(headers, rows);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv;charset=utf-8;',
        'Content-Disposition': `attachment; filename="payments-${date}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export payments error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to export payments' },
      { status: 500 }
    );
  }
}
