import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireOrganization, requirePermission } from '@/lib/require-permission';

const updateInventorySchema = z.object({
  name: z.string().optional(),
  sku: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  unitOfMeasure: z.string().optional(),
  quantity: z.number().optional(),
  minStock: z.number().optional(),
  unitCost: z.number().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
});

type RouteParams = { params: Promise<{ id: string }> };

// PUT /api/inventory/[id] - Update inventory item
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { user, organizationId } = await requireOrganization();
    await requirePermission('inventory:write', organizationId);
    const { id } = await params;
    const body = await request.json();

    const validation = updateInventorySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    // Verify ownership
    const existingItem = await prisma.inventoryItem.findFirst({
      where: { id, organizationId },
    });

    if (!existingItem) {
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
    }

    const updatedItem = await prisma.$transaction(async (tx) => {
      // Calculate difference if quantity is being updated
      if (
        validation.data.quantity !== undefined &&
        validation.data.quantity !== Number(existingItem.quantity)
      ) {
        const diff = validation.data.quantity - Number(existingItem.quantity);

        await tx.inventoryMovement.create({
          data: {
            tailorId: user.id,
            organizationId,
            itemId: id,
            type: 'ADJUSTMENT',
            quantity: Math.abs(diff),
            reason: diff > 0 ? 'Manual Adjustment (+)' : 'Manual Adjustment (-)',
          },
        });
      }

      const item = await tx.inventoryItem.update({
        where: { id },
        data: validation.data,
      });

      return item;
    });

    return NextResponse.json({ success: true, data: updatedItem });
  } catch (error) {
    console.error('Update inventory error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update item' }, { status: 500 });
  }
}

// DELETE /api/inventory/[id] - Delete (or deactivate) inventory item
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { organizationId } = await requireOrganization();
    await requirePermission('inventory:write', organizationId);
    const { id } = await params;

    const existingItem = await prisma.inventoryItem.findFirst({
      where: { id, organizationId },
      select: { id: true },
    });

    if (!existingItem) {
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
    }

    // Soft delete by setting isActive = false
    await prisma.inventoryItem.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, message: 'Item deleted' });
  } catch (error) {
    console.error('Delete inventory error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete item' }, { status: 500 });
  }
}
