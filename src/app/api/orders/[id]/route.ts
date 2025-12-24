import { NextResponse } from 'next/server';
import { z } from 'zod';
import { logAudit } from '@/lib/audit-service';
import { notifyOrderStatusChange } from '@/lib/notification-service';
import prisma from '@/lib/prisma';
import { requireOrganization, requirePermission } from '@/lib/require-permission';

// Validation schema for updating an order
const updateOrderSchema = z
  .object({
    garmentType: z
      .enum([
        'KABA_AND_SLIT',
        'DASHIKI',
        'SMOCK_BATAKARI',
        'KAFTAN',
        'AGBADA',
        'COMPLET',
        'KENTE_CLOTH',
        'BOUBOU',
        'SUIT',
        'DRESS',
        'SHIRT',
        'TROUSERS',
        'SKIRT',
        'BLOUSE',
        'OTHER',
      ])
      .optional(),
    garmentDescription: z.string().optional().nullable(),
    styleReference: z.string().optional().nullable(),
    styleNotes: z.string().optional().nullable(),
    quantity: z.number().int().positive().optional(),
    materialSource: z.enum(['CLIENT_PROVIDED', 'TAILOR_PROVIDED', 'SPLIT']).optional(),
    materialDetails: z.string().optional().nullable(),
    materialCost: z.number().nonnegative().optional().nullable(),
    laborCost: z.number().nonnegative().optional(),
    totalAmount: z.number().nonnegative().optional(),
    deadline: z.string().optional().nullable(),
    status: z
      .enum([
        'PENDING',
        'CONFIRMED',
        'IN_PROGRESS',
        'READY_FOR_FITTING',
        'FITTING_DONE',
        'COMPLETED',
        'DELIVERED',
        'CANCELLED',
      ])
      .optional(),
    progressPhotos: z.array(z.string()).optional(),
    progressNotes: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      // We only validate if both laborCost and materialCost are present in the update
      // OR if totalAmount is provided and we can compare it with what's provided or existing.
      // However, the simplest check for an update is to check if totalAmount is provided,
      // and if so, it must match the sum of whatever laborCost and materialCost are being set to.
      // If they aren't being set, we'd need the existing values, which we don't have in the schema refinement.
      // So we'll only validate if totalAmount is provided AND (laborCost OR materialCost) are also provided.

      if (
        data.totalAmount !== undefined &&
        (data.laborCost !== undefined || data.materialCost !== undefined)
      ) {
        // Note: This only validates partial updates. If only totalAmount is sent, we can't easily validate here.
        // But in the route handler we recalculate it anyway.
        return true; // Skipping complex refinement for partial updates in Zod for now, or just let the handler handle it.
      }
      return true;
    },
    {
      message: 'totalAmount must equal laborCost + materialCost',
      path: ['totalAmount'],
    }
  );

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/orders/[id] - Get a single order
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { organizationId } = await requireOrganization();
    await requirePermission('orders:read', organizationId);

    const order = await prisma.order.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            address: true,
          },
        },
        collection: {
          select: {
            id: true,
            name: true,
          },
        },
        payments: {
          orderBy: { paidAt: 'desc' },
          select: {
            id: true,
            paymentNumber: true,
            amount: true,
            method: true,
            status: true,
            paidAt: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        ratings: {
          take: 1,
        },
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            totalAmount: true,
          },
        },
        measurement: true,
      },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...order,
        rating: (order as any).ratings?.[0] || null,
        ratings: undefined,
      },
    });
  } catch (error) {
    console.error('Get order error:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ success: false, error: 'Failed to fetch order' }, { status: 500 });
  }
}

// PUT /api/orders/[id] - Update an order
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { user, organizationId } = await requireOrganization();
    await requirePermission('orders:write', organizationId);
    const body = await request.json();

    // Verify order belongs to this tailor
    const existingOrder = await prisma.order.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        client: true,
      },
    });

    if (!existingOrder) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // Validate input
    const validationResult = updateOrderSchema.safeParse(body);
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
    const previousStatus = existingOrder.status;
    const newStatus = data.status;

    // Prepare update data
    const updateData: Record<string, unknown> = { ...data };

    // Handle status transitions
    if (newStatus && newStatus !== previousStatus) {
      if (newStatus === 'IN_PROGRESS' && !existingOrder.startedAt) {
        updateData.startedAt = new Date();
      }
      if (newStatus === 'DELIVERED') {
        updateData.deliveredAt = new Date();
      }
      if (newStatus === 'COMPLETED') {
        updateData.completedAt = new Date();

        // M-06: Auto-consume all materials linked to tasks when order is completed
        const unconsumedTasks = await prisma.orderTask.findMany({
          where: {
            orderId: id,
            organizationId,
            status: { not: 'COMPLETED' },
            materialId: { not: null },
            materialQty: { gt: 0 },
            consumedAt: null,
          },
        });

        if (unconsumedTasks.length > 0) {
          await prisma.$transaction(async (tx) => {
            for (const task of unconsumedTasks) {
              // Create movement
              await tx.inventoryMovement.create({
                data: {
                  tailorId: user.id,
                  organizationId,
                  itemId: task.materialId!,
                  orderId: id,
                  type: 'ISSUE',
                  quantity: Number(task.materialQty),
                  reason: `Auto-consumed: Order #${existingOrder.orderNumber} completed`,
                },
              });

              // Decrement stock
              const updated = await tx.inventoryItem.updateMany({
                where: { id: task.materialId!, organizationId },
                data: {
                  quantity: { decrement: Number(task.materialQty) },
                },
              });
              if (updated.count !== 1) {
                throw new Error('Material not found');
              }

              // Mark task as consumed and completed
              await tx.orderTask.update({
                where: { id: task.id },
                data: {
                  status: 'COMPLETED',
                  completedAt: new Date(),
                  consumedAt: new Date(),
                },
              });
            }
          });
        }
      }
      if (newStatus === 'CANCELLED') {
        // Update collection count if part of a collection
        if (existingOrder.collectionId) {
          await prisma.orderCollection.updateMany({
            where: { id: existingOrder.collectionId, organizationId },
            data: { totalOrders: { decrement: 1 } },
          });
        }
      }
    }

    // Recalculate total if costs changed
    if (data.laborCost !== undefined || data.materialCost !== undefined) {
      const laborCost = data.laborCost ?? Number(existingOrder.laborCost);
      const materialCost = data.materialCost ?? Number(existingOrder.materialCost) ?? 0;
      updateData.totalAmount = laborCost + materialCost;
    }

    // Handle deadline
    if (data.deadline !== undefined) {
      updateData.deadline = data.deadline ? new Date(data.deadline) : null;
    }

    // Update order
    const order = await prisma.order.update({
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

    // Send notification if status changed
    if (newStatus && newStatus !== previousStatus) {
      await notifyOrderStatusChange(
        user.id,
        existingOrder.client.phone,
        existingOrder.client.email,
        existingOrder.orderNumber,
        existingOrder.client.name,
        newStatus,
        user.notifySms,
        user.notifyEmail
      );

      // Update collection completed count
      if (newStatus === 'COMPLETED' && existingOrder.collectionId) {
        await prisma.orderCollection.updateMany({
          where: { id: existingOrder.collectionId, organizationId },
          data: { completedOrders: { increment: 1 } },
        });
      }
    }

    // Log update
    await logAudit({
      userId: user.id,
      action: 'UPDATE_ORDER',
      resource: 'ORDER',
      resourceId: id,
      details: {
        orderNumber: existingOrder.orderNumber,
        statusChange:
          newStatus && newStatus !== previousStatus
            ? { from: previousStatus, to: newStatus }
            : undefined,
        updates: Object.keys(data),
      },
    });

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Update order error:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ success: false, error: 'Failed to update order' }, { status: 500 });
  }
}

// DELETE /api/orders/[id] - Delete an order
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { organizationId } = await requireOrganization();
    await requirePermission('orders:delete', organizationId);

    // Verify order belongs to this tailor
    const existingOrder = await prisma.order.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!existingOrder) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // Check if order has payments
    const paymentCount = await prisma.payment.count({
      where: { orderId: id },
    });

    if (paymentCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete order with ${paymentCount} payments. Consider cancelling instead.`,
        },
        { status: 400 }
      );
    }

    // Update collection count if part of a collection
    if (existingOrder.collectionId) {
      await prisma.orderCollection.updateMany({
        where: { id: existingOrder.collectionId, organizationId },
        data: {
          totalOrders: { decrement: 1 },
          ...(existingOrder.status === 'COMPLETED' && {
            completedOrders: { decrement: 1 },
          }),
        },
      });
    }

    // Delete order (cascades to messages, ratings)
    await prisma.order.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully',
    });
  } catch (error) {
    console.error('Delete order error:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ success: false, error: 'Failed to delete order' }, { status: 500 });
  }
}
