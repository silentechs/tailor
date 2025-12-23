import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireOrganization, requirePermission } from '@/lib/require-permission';

const updateTaskSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  assignedTo: z.string().optional(),
  materialId: z.string().min(1).nullable().optional(),
  materialQty: z.number().nullable().optional(),
});

type RouteParams = { params: Promise<{ id: string; taskId: string }> };

// PATCH /api/orders/[id]/tasks/[taskId] - Update a task
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { user, organizationId } = await requireOrganization();
    await requirePermission('tasks:write', organizationId);

    const { id: orderId, taskId } = await params;
    const body = await request.json();

    const validation = updateTaskSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.format() },
        { status: 400 }
      );
    }

    if (validation.data.materialQty != null && validation.data.materialId == null) {
      return NextResponse.json(
        { success: false, error: 'materialId is required when materialQty is provided' },
        { status: 400 }
      );
    }

    // SECURITY: If material is referenced, verify it belongs to this organization
    if (validation.data.materialId) {
      const material = await prisma.inventoryItem.findFirst({
        where: { id: validation.data.materialId, organizationId, isActive: true },
        select: { id: true },
      });
      if (!material) {
        return NextResponse.json(
          { success: false, error: 'Material not found' },
          { status: 404 }
        );
      }
    }

    const existingTask = await prisma.orderTask.findFirst({
      where: { id: taskId, orderId, organizationId },
    });

    if (!existingTask) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    const data: any = { ...validation.data };

    // Status transitions
    if (data.status === 'IN_PROGRESS' && !existingTask.startedAt) {
      data.startedAt = new Date();
    }

    const result = await prisma.$transaction(async (tx) => {
      // Inventory Deduction Logic
      if (data.status === 'COMPLETED' && existingTask.status !== 'COMPLETED') {
        data.completedAt = new Date();

        const matId = data.materialId !== undefined ? data.materialId : existingTask.materialId;
        const matQty = data.materialQty !== undefined ? data.materialQty : existingTask.materialQty;

        if (matId && matQty && !existingTask.consumedAt) {
          // 1. Create inventory movement
          await tx.inventoryMovement.create({
            data: {
              tailorId: user.id,
              organizationId,
              itemId: matId,
              orderId: existingTask.orderId,
              type: 'ISSUE',
              quantity: Number(matQty),
              reason: `Auto-consumed: Task "${data.title || existingTask.title}" completed`,
            },
          });

          // 2. Decrement inventory item quantity
          const updated = await tx.inventoryItem.updateMany({
            where: { id: matId, organizationId },
            data: {
              quantity: {
                decrement: Number(matQty),
              },
            },
          });
          if (updated.count !== 1) {
            throw new Error('Material not found');
          }

          data.consumedAt = new Date();
        }
      }

      // Final task update
      return await tx.orderTask.update({
        where: { id: taskId },
        data,
      });
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Update task error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update task' }, { status: 500 });
  }
}

// DELETE /api/orders/[id]/tasks/[taskId] - Delete a task
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { organizationId } = await requireOrganization();
    await requirePermission('tasks:write', organizationId);

    const { id: orderId, taskId } = await params;

    const existingTask = await prisma.orderTask.findFirst({
      where: { id: taskId, orderId, organizationId },
    });

    if (!existingTask) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    await prisma.orderTask.delete({
      where: { id: taskId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete task error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete task' }, { status: 500 });
  }
}
