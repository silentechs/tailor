import type { PaymentMethod, Prisma } from '@prisma/client';
import { registry, z } from '@/lib/api-docs';
import { secureErrorResponse, secureJsonResponse, withSecurity } from '@/lib/api-security';
import { logAudit } from '@/lib/audit-service';
import { generatePaymentNumber } from '@/lib/invoice-numbering-system';
import { notifyPaymentReceived, notifyClientPaymentReceived } from '@/lib/notification-service';
import prisma from '@/lib/prisma';
import { requireOrganization, requirePermission } from '@/lib/require-permission';
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
    'PAYSTACK',
  ]),
  mobileNumber: z.string().optional().nullable(),
  transactionId: z.string().optional().nullable(),
  bankName: z.string().optional().nullable(),
  accountNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// Register Payment Schema
registry.register('Payment', createPaymentSchema);

// Register GET /payments
registry.registerPath({
  method: 'get',
  path: '/payments',
  summary: 'List all payments',
  description: 'Returns a paginated list of payments.',
  security: [{ cookieAuth: [] }, { bearerAuth: [] }],
  responses: {
    200: {
      description: 'Success',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.array(z.any()),
            pagination: z.object({
              page: z.number(),
              pageSize: z.number(),
              total: z.number(),
              totalPages: z.number(),
            }),
          }),
        },
      },
    },
  },
});

// Register POST /payments
registry.registerPath({
  method: 'post',
  path: '/payments',
  summary: 'Record a payment',
  description: 'Records a new payment for a client/order/invoice.',
  security: [{ cookieAuth: [] }, { bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: createPaymentSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Payment recorded successfully',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.any(),
          }),
        },
      },
    },
    400: { description: 'Validation failed' },
  },
});

// GET /api/payments - List all payments
export const GET = withSecurity(async (request: Request) => {
  try {
    const { organizationId } = await requireOrganization();
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
          select: { id: true, name: true, phone: true },
        },
        order: {
          select: { id: true, orderNumber: true, garmentType: true },
        },
      },
    });

    return secureJsonResponse({
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
      return secureErrorResponse('Unauthorized', 401);
    }
    return secureErrorResponse('Failed to fetch payments', 500);
  }
}, 'payments:list');

// POST /api/payments - Create a new payment
export const POST = withSecurity(
  async (_request: Request, { sanitizedBody }) => {
    try {
      const { user, organizationId } = await requireOrganization();
      await requirePermission('payments:write', organizationId);

      const body = sanitizedBody;

      const validationResult = createPaymentSchema.safeParse(body);
      if (!validationResult.success) {
        return secureErrorResponse('Validation failed', 400);
      }

      const data = validationResult.data;

      // Verify client
      const client = await prisma.client.findFirst({
        where: { id: data.clientId, organizationId },
      });

      if (!client) {
        return secureErrorResponse('Client not found', 404);
      }

      // Verify order if provided
      let order = null;
      if (data.orderId) {
        order = await prisma.order.findFirst({
          where: { id: data.orderId, organizationId },
        });

        if (!order) {
          return secureErrorResponse('Order not found', 404);
        }
      }

      // Verify invoice if provided (SECURITY: never trust cross-org IDs)
      let invoice = null;
      if (data.invoiceId) {
        invoice = await prisma.invoice.findFirst({
          where: { id: data.invoiceId, organizationId },
        });

        if (!invoice) {
          return secureErrorResponse('Invoice not found', 404);
        }

        if (invoice.clientId !== data.clientId) {
          return secureErrorResponse('Invoice does not match client', 400);
        }
      }

      // Generate payment number
      const paymentNumber = await generatePaymentNumber(user.id);

      // Create payment
      const payment = await prisma.payment.create({
        data: {
          paymentNumber,
          tailorId: user.id,
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
            select: { name: true, phone: true, email: true, userId: true },
          },
          order: {
            select: { orderNumber: true },
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
      if (invoice) {
        const newPaidAmount = Number(invoice.paidAmount) + data.amount;
        const newStatus = newPaidAmount >= Number(invoice.totalAmount) ? 'PAID' : invoice.status;

        await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            paidAmount: newPaidAmount,
            status: newStatus,
            ...(newStatus === 'PAID' && { paidAt: new Date() }),
          },
        });

        // If invoice is linked to an order, and that order wasn't already updated above
        if (invoice.orderId && data.orderId !== invoice.orderId) {
          const linkedOrder = await prisma.order.findUnique({
            where: { id: invoice.orderId },
          });
          if (linkedOrder) {
            await prisma.order.update({
              where: { id: linkedOrder.id },
              data: {
                paidAmount: Number(linkedOrder.paidAmount) + data.amount,
              },
            });
          }
        }
      }

      // Send notification to tailor
      await notifyPaymentReceived(
        user.id,
        client.phone,
        client.email,
        client.name,
        formatCurrency(data.amount),
        user.notifySms,
        user.notifyEmail
      );

      // Send in-app notification to client if they have a linked account
      if (payment.client.userId && payment.order?.orderNumber) {
        await notifyClientPaymentReceived(
          payment.client.userId,
          formatCurrency(data.amount),
          payment.order.orderNumber,
          user.businessName || user.name
        );
      }

      // Audit Log
      await logAudit({
        userId: user.id,
        action: 'PAYMENT_CREATE',
        resource: 'payment',
        resourceId: payment.id,
        details: {
          clientName: client.name,
          amount: data.amount,
          orderId: data.orderId,
          method: data.method,
          organizationId,
        },
      });

      return secureJsonResponse({ success: true, data: payment }, { status: 201 });
    } catch (error) {
      console.error('Create payment error:', error);
      if (error instanceof Error && error.message === 'Unauthorized') {
        return secureErrorResponse('Unauthorized', 401);
      }
      return secureErrorResponse('Failed to create payment', 500);
    }
  },
  'payments:create',
  { rateLimit: 'write' }
);
