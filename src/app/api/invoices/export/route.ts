import { NextResponse } from 'next/server';
import { requireActiveTailor } from '@/lib/direct-current-user';
import { generateCSV, generateExcelXML } from '@/lib/export-utils';
import prisma from '@/lib/prisma';

// GET /api/invoices/export - Export invoices as CSV or Excel
export async function GET(request: Request) {
  try {
    const user = await requireActiveTailor();
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';

    const invoices = await prisma.invoice.findMany({
      where: { tailorId: user.id },
      orderBy: { createdAt: 'desc' },
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
      'Invoice Number',
      'Date',
      'Due Date',
      'Client Name',
      'Client Phone',
      'Order Number',
      'Subtotal (GHS)',
      'VAT (GHS)',
      'NHIL (GHS)',
      'GETFUND (GHS)',
      'Total (GHS)',
      'Paid (GHS)',
      'Balance (GHS)',
      'Status',
    ];

    const rows = invoices.map((invoice) => {
      const total = Number(invoice.totalAmount);
      const paid = Number(invoice.paidAmount);
      return [
        invoice.invoiceNumber,
        new Date(invoice.createdAt).toLocaleDateString('en-GB'),
        invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-GB') : '',
        invoice.client.name,
        invoice.client.phone,
        invoice.order?.orderNumber || '',
        Number(invoice.subtotal).toFixed(2),
        Number(invoice.vatAmount).toFixed(2),
        Number(invoice.nhilAmount).toFixed(2),
        Number(invoice.getfundAmount).toFixed(2),
        total.toFixed(2),
        paid.toFixed(2),
        (total - paid).toFixed(2),
        invoice.status,
      ];
    });

    const date = new Date().toISOString().split('T')[0];

    if (format === 'xlsx') {
      const xml = generateExcelXML(headers, rows, 'Invoices');
      return new NextResponse(xml, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.ms-excel',
          'Content-Disposition': `attachment; filename="invoices-${date}.xls"`,
        },
      });
    }

    // Default to CSV
    const csv = generateCSV(headers, rows);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv;charset=utf-8;',
        'Content-Disposition': `attachment; filename="invoices-${date}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export invoices error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to export invoices' },
      { status: 500 }
    );
  }
}
