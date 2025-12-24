import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireActiveTailor } from '@/lib/direct-current-user';
import { formatCurrency, formatDate } from '@/lib/utils';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
    try {
        const user = await requireActiveTailor();
        const { id } = await params;

        const payment = await prisma.payment.findFirst({
            where: {
                id,
                tailorId: user.id,
            },
            include: {
                client: true,
                order: true,
            },
        });

        if (!payment) {
            return new Response('Payment not found', { status: 404 });
        }

        const organization = await prisma.organization.findFirst({
            where: { ownerId: user.id }
        });

        const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Receipt - ${payment.paymentNumber}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1f2937; line-height: 1.5; }
            .receipt-box { max-width: 800px; margin: auto; padding: 40px; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
            .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #f3f4f6; padding-bottom: 20px; }
            .logo { font-size: 28px; font-weight: 800; color: #7c3aed; letter-spacing: -0.025em; }
            .info { text-align: right; font-size: 14px; }
            .info strong { color: #4b5563; }
            .details { margin-bottom: 40px; }
            .details table { width: 100%; border-collapse: collapse; }
            .details th { background: #f9fafb; text-align: left; padding: 12px; border-bottom: 2px solid #f3f4f6; font-size: 12px; text-transform: uppercase; color: #6b7280; }
            .details td { padding: 16px 12px; border-bottom: 1px solid #f3f4f6; }
            .details td small { color: #6b7280; }
            .total { text-align: right; margin-top: 30px; font-size: 24px; font-weight: 800; color: #111827; }
            .footer { margin-top: 60px; text-align: center; color: #9ca3af; font-size: 14px; border-top: 1px solid #f3f4f6; padding-top: 20px; }
            .button-container { text-align: right; max-width: 800px; margin: 0 auto 20px auto; }
            .print-btn { padding: 8px 16px; background: #7c3aed; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 14px; transition: background 0.2s; }
            .print-btn:hover { background: #6d28d9; }
            @media print { .no-print { display: none; } body { padding: 0; } .receipt-box { border: none; box-shadow: none; width: 100%; max-width: 100%; } }
          </style>
        </head>
        <body>
          <div class="button-container no-print">
            <button onclick="window.print()" class="print-btn">Print Receipt</button>
          </div>
          <div class="receipt-box">
            <div class="header">
              <div class="logo">
                ${organization?.name || 'StitchCraft'}
              </div>
              <div class="info">
                <div><strong>Receipt #:</strong> ${payment.paymentNumber}</div>
                <div><strong>Date:</strong> ${formatDate(payment.paidAt)}</div>
                <div><strong>Status:</strong> <span style="color: #059669; font-weight: 600;">${payment.status}</span></div>
              </div>
            </div>

            <div class="details">
              <div style="margin-bottom: 30px;">
                <div style="font-size: 12px; text-transform: uppercase; color: #6b7280; font-weight: 600; margin-bottom: 4px;">Billed To</div>
                <div style="font-size: 18px; font-weight: 700; color: #111827;">${payment.client.name}</div>
                ${payment.client.phone ? `<div style="color: #4b5563;">${payment.client.phone}</div>` : ''}
                ${payment.client.address ? `<div style="color: #4b5563;">${payment.client.address}</div>` : ''}
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Payment Method</th>
                    <th style="text-align: right;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div style="font-weight: 600;">Payment for Order ${payment.order?.orderNumber || 'N/A'}</div>
                      <small>${payment.order?.garmentType?.replace(/_/g, ' ') || ''}</small>
                    </td>
                    <td style="text-transform: capitalize;">${payment.method.replace(/_/g, ' ').toLowerCase()}</td>
                    <td style="text-align: right; font-weight: 600;">${formatCurrency(Number(payment.amount))}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="total">
              <span style="font-size: 14px; color: #6b7280; font-weight: 600; text-transform: uppercase; margin-right: 12px;">Total Paid</span>
              ${formatCurrency(Number(payment.amount))}
            </div>

            <div class="footer">
              <p>Thank you for choosing ${organization?.name || 'StitchCraft Ghana'}!</p>
              <div style="font-size: 12px; margin-top: 8px;">Receipt generated on ${new Date().toLocaleString()}</div>
            </div>
          </div>
        </body>
      </html>
    `;

        return new Response(html, {
            headers: {
                'Content-Type': 'text/html',
            },
        });
    } catch (error) {
        console.error('Receipt Error:', error);
        return new Response('Failed to generate receipt', { status: 500 });
    }
}
