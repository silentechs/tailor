import type { PaymentMethod, Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { logAudit } from '@/lib/audit-service';
import { requireOrganization, requirePermission } from '@/lib/require-permission';
import { generatePaymentNumber } from '@/lib/invoice-numbering-system';
import { notifyPaymentReceived } from '@/lib/notification-service';
import prisma from '@/lib/prisma';
import { formatCurrency } from '@/lib/utils';

// Validation schema for creating a payment
const createPaymentSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  orderId: z.string().optional().nullable(),
  invoiceId: z.string().optional().nullable(),
  amount: z.number().positive('Amount must be positive'),
  method: z.enum([
    'CASH',
    'MOBILE_MONEY_MTN',
    'MOBILE_MONEY_VODAFONE',
    'MOBILE_MONEY_AIRTELTIGO',
    'BANK_TRANSFER',
  ]),
  mobileNumber: z.string().optional().nullable(),
  transactionId: z.string().optional().nullable(),
  bankName: z.string().optional().nullable(),
  accountNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// GET /api/payments - List all payments
export async function GET(request: Request) {
  try {
    const { user, organizationId } = await requireOrganization();
    await requirePermission('payments:read', organizationId);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const clientId = searchParams.get('clientId');
    const orderId = searchParams.get('orderId');
    const method = searchParams.get('method');

    const where: Prisma.PaymentWhereInput = {
      organizationId,
      ...(clientId && { clientId }),
      ...(orderId && { orderId }),
      ...(method && { method: method as PaymentMethod }),
    };

    const total = await prisma.payment.count({ where });

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { paidAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            garmentType: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: payments,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Get payments error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Handle Forbidden (missing permission)
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

// POST /api/payments - Create a new payment
export async function POST(request: Request) {
  try {
    const { user, organizationId } = await requireOrganization();
    await requirePermission('payments:write', organizationId);

    const body = await request.json();

    const validationResult = createPaymentSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Verify client
    const client = await prisma.client.findFirst({
      where: { id: data.clientId, organizationId },
    });

    if (!client) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    // Verify order if provided
    let order = null;
    if (data.orderId) {
      order = await prisma.order.findFirst({
        where: { id: data.orderId, organizationId },
      });

      if (!order) {
        return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
      }
    }

    // Generate payment number
    const paymentNumber = await generatePaymentNumber(user.id);

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        paymentNumber,
        tailorId: user.id, // Keep tailorId as creator/owner reference
        organizationId,
        clientId: data.clientId,
        orderId: data.orderId,
        invoiceId: data.invoiceId,
        amount: data.amount,
        method: data.method,
        status: 'COMPLETED',
        mobileNumber: data.mobileNumber,
        transactionId: data.transactionId,
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        notes: data.notes,
      },
      include: {
        client: {
          select: { name: true, phone: true, email: true },
        },
      },
    });

    // Update order paid amount if linked to an order
    if (order) {
      const newPaidAmount = Number(order.paidAmount) + data.amount;
      await prisma.order.update({
        where: { id: order.id },
        data: { paidAmount: newPaidAmount },
      });
    }

    // Update invoice if linked
    if (data.invoiceId) {
      const invoice = await prisma.invoice.findUnique({
        where: { id: data.invoiceId },
      });

      if (invoice) {
        const newPaidAmount = Number(invoice.paidAmount) + data.amount;
        const newStatus = newPaidAmount >= Number(invoice.totalAmount) ? 'PAID' : invoice.status;

        await prisma.invoice.update({
          where: { id: data.invoiceId },
          data: {
            paidAmount: newPaidAmount,
            status: newStatus,
            ...(newStatus === 'PAID' && { paidAt: new Date() }),
          },
        });
      }
    }

    // Send notification
    await notifyPaymentReceived(
      user.id,
      client.phone,
      client.email,
      client.name,
      formatCurrency(data.amount),
      user.notifySms,
      user.notifyEmail
    );

    // Log payment
    await logAudit({
      userId: user.id,
      action: 'CREATE_PAYMENT',
      resource: 'PAYMENT',
      resourceId: payment.id,
      details: {
        clientName: client.name,
        amount: data.amount,
        orderId: data.orderId,
        method: data.method,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: payment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create payment error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Handle Forbidden (missing permission)
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}
