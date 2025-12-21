import type { InvoiceStatus } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireActiveTailor } from '@/lib/direct-current-user';
import { calculateInvoice, type InvoiceLineItem } from '@/lib/ghana-invoice-calculations';
import prisma from '@/lib/prisma';
import { notifyInvoiceSent } from '@/lib/notification-service';
import { formatCurrency } from '@/lib/utils';

// Validation schema for updating an invoice
const updateInvoiceSchema = z.object({
    status: z.enum(['DRAFT', 'SENT', 'VIEWED', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
    items: z.array(z.object({
        description: z.string().min(1),
        quantity: z.number().int().positive(),
        unitPrice: z.number().nonnegative(),
        amount: z.number().nonnegative(),
    })).optional(),
    template: z.enum(['modern', 'classic', 'minimal']).optional(),
    notes: z.string().optional().nullable(),
    termsConditions: z.string().optional().nullable(),
    dueDate: z.string().optional().nullable(),
});

// GET /api/invoices/[id] - Get single invoice
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireActiveTailor();
        const { id } = await params;

        const invoice = await prisma.invoice.findFirst({
            where: {
                id,
                tailorId: user.id,
            },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        email: true,
                        address: true,
                        region: true,
                        city: true,
                    },
                },
                order: {
                    select: {
                        id: true,
                        orderNumber: true,
                        garmentType: true,
                        status: true,
                    },
                },
                payments: {
                    orderBy: { paidAt: 'desc' },
                    select: {
                        id: true,
                        paymentNumber: true,
                        amount: true,
                        method: true,
                        paidAt: true,
                    },
                },
                tailor: {
                    select: {
                        id: true,
                        name: true,
                        businessName: true,
                        phone: true,
                        email: true,
                        businessAddress: true,
                        region: true,
                        city: true,
                    },
                },
            },
        });

        if (!invoice) {
            return NextResponse.json(
                { success: false, error: 'Invoice not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: invoice,
        });
    } catch (error) {
        console.error('Get invoice error:', error);

        if (error instanceof Error && error.message === 'Unauthorized') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        return NextResponse.json(
            { success: false, error: 'Failed to fetch invoice' },
            { status: 500 }
        );
    }
}

// PUT /api/invoices/[id] - Update invoice
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireActiveTailor();
        const { id } = await params;
        const body = await request.json();

        const validationResult = updateInvoiceSchema.safeParse(body);
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

        // Verify invoice exists and belongs to tailor
        const existingInvoice = await prisma.invoice.findFirst({
            where: { id, tailorId: user.id },
        });

        if (!existingInvoice) {
            return NextResponse.json(
                { success: false, error: 'Invoice not found' },
                { status: 404 }
            );
        }

        // Build update data
        const updateData: any = {};

        if (data.status) {
            updateData.status = data.status as InvoiceStatus;

            // Set timestamps based on status
            if (data.status === 'SENT' && !existingInvoice.sentAt) {
                updateData.sentAt = new Date();
            }
            if (data.status === 'VIEWED' && !existingInvoice.viewedAt) {
                updateData.viewedAt = new Date();
            }
            if (data.status === 'PAID' && !existingInvoice.paidAt) {
                updateData.paidAt = new Date();
            }
        }

        if (data.items) {
            // Recalculate totals with Ghana taxes
            const calculation = calculateInvoice(data.items as InvoiceLineItem[]);
            updateData.items = data.items;
            updateData.subtotal = calculation.subtotal;
            updateData.vatAmount = calculation.vatAmount;
            updateData.nhilAmount = calculation.nhilAmount;
            updateData.getfundAmount = calculation.getfundAmount;
            updateData.totalAmount = calculation.totalAmount;
        }

        if (data.template !== undefined) updateData.template = data.template;
        if (data.notes !== undefined) updateData.notes = data.notes;
        if (data.termsConditions !== undefined) updateData.termsConditions = data.termsConditions;
        if (data.dueDate !== undefined) {
            updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
        }

        const invoice = await prisma.invoice.update({
            where: { id },
            data: updateData,
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

        // If status changed to SENT, trigger notification
        if (data.status === 'SENT' && existingInvoice.status !== 'SENT') {
            await notifyInvoiceSent(
                user.id,
                invoice.client.phone,
                invoice.client.email || null,
                invoice.client.name,
                invoice.invoiceNumber,
                formatCurrency(Number(invoice.totalAmount))
            );
        }

        return NextResponse.json({
            success: true,
            data: invoice,
        });
    } catch (error) {
        console.error('Update invoice error:', error);

        if (error instanceof Error && error.message === 'Unauthorized') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        return NextResponse.json(
            { success: false, error: 'Failed to update invoice' },
            { status: 500 }
        );
    }
}

// DELETE /api/invoices/[id] - Delete invoice
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireActiveTailor();
        const { id } = await params;

        // Verify invoice exists and belongs to tailor
        const existingInvoice = await prisma.invoice.findFirst({
            where: { id, tailorId: user.id },
        });

        if (!existingInvoice) {
            return NextResponse.json(
                { success: false, error: 'Invoice not found' },
                { status: 404 }
            );
        }

        // Only allow deleting DRAFT invoices
        if (existingInvoice.status !== 'DRAFT') {
            return NextResponse.json(
                { success: false, error: 'Only draft invoices can be deleted' },
                { status: 400 }
            );
        }

        await prisma.invoice.delete({
            where: { id },
        });

        return NextResponse.json({
            success: true,
            message: 'Invoice deleted successfully',
        });
    } catch (error) {
        console.error('Delete invoice error:', error);

        if (error instanceof Error && error.message === 'Unauthorized') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        return NextResponse.json(
            { success: false, error: 'Failed to delete invoice' },
            { status: 500 }
        );
    }
}
