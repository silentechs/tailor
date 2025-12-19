import type { InvoiceStatus, Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireActiveTailor } from '@/lib/direct-current-user';
import { calculateInvoice, type InvoiceLineItem } from '@/lib/ghana-invoice-calculations';
import { generateInvoiceNumber } from '@/lib/invoice-numbering-system';
import prisma from '@/lib/prisma';

// Validation schema for invoice line item
const lineItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  amount: z.number().nonnegative(),
});

// Validation schema for creating an invoice
const createInvoiceSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  orderId: z.string().optional().nullable(),
  items: z.array(lineItemSchema).min(1, 'At least one item is required'),
  template: z.enum(['modern', 'classic', 'minimal']).default('modern'),
  notes: z.string().optional().nullable(),
  termsConditions: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

// GET /api/invoices - List all invoices
export async function GET(request: Request) {
  try {
    const user = await requireActiveTailor();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const status = searchParams.get('status');
    const clientId = searchParams.get('clientId');

    const where: Prisma.InvoiceWhereInput = {
      tailorId: user.id,
      ...(status && { status: status as InvoiceStatus }),
      ...(clientId && { clientId }),
    };

    const total = await prisma.invoice.count({ where });

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
        _count: {
          select: { payments: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: invoices.map((inv) => {
        const { _count, ...rest } = inv;
        return {
          ...rest,
          paymentCount: _count.payments,
        };
      }),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Get invoices error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}

// POST /api/invoices - Create a new invoice
export async function POST(request: Request) {
  try {
    const user = await requireActiveTailor();
    const body = await request.json();

    const validationResult = createInvoiceSchema.safeParse(body);
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
      where: { id: data.clientId, tailorId: user.id },
    });

    if (!client) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber(user.id);

    // Calculate totals with Ghana taxes
    const calculation = calculateInvoice(data.items as InvoiceLineItem[]);

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        tailorId: user.id,
        clientId: data.clientId,
        orderId: data.orderId,
        items: data.items,
        subtotal: calculation.subtotal,
        vatAmount: calculation.vatAmount,
        nhilAmount: calculation.nhilAmount,
        getfundAmount: calculation.getfundAmount,
        totalAmount: calculation.totalAmount,
        template: data.template,
        notes: data.notes,
        termsConditions: data.termsConditions,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        status: 'DRAFT',
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: invoice,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create invoice error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create invoice' },
      { status: 500 }
    );
  }
}
