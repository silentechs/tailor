import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireActiveTailor } from '@/lib/direct-current-user';
import prisma from '@/lib/prisma';

const movementSchema = z.object({
  itemId: z.string(),
  type: z.enum(['RECEIPT', 'ISSUE', 'ADJUSTMENT', 'TRANSFER', 'RETURN', 'DAMAGED']),
  quantity: z.number().positive(),
  orderId: z.string().optional().nullable(),
  reason: z.string().optional().nullable(),
});

// GET /api/inventory/movements - Get recent movements
export async function GET(request: Request) {
  try {
    const user = await requireActiveTailor();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const type = searchParams.get('type');
    const orderId = searchParams.get('orderId');

    const movements = await prisma.inventoryMovement.findMany({
      where: {
        tailorId: user.id,
        ...(type && { type: type as any }),
        ...(orderId && { orderId }),
      },
      include: {
        item: {
          select: { name: true, unitOfMeasure: true, unitCost: true },
        },
        order: {
          select: { orderNumber: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({ success: true, data: movements });
  } catch (error) {
    console.error('Get movements error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch movements' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireActiveTailor();
    const body = await request.json();

    const validation = movementSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { itemId, type, quantity, orderId, reason } = validation.data;

    // Verify item belongs to tailor
    const item = await prisma.inventoryItem.findFirst({
      where: { id: itemId, tailorId: user.id },
    });

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Inventory item not found' },
        { status: 404 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Record the movement
      const movement = await tx.inventoryMovement.create({
        data: {
          tailorId: user.id,
          itemId,
          orderId,
          type,
          quantity,
          reason,
        },
      });

      // 2. Update the item's current quantity
      // Logic: RECEIPT, RETURN, positive ADJUSTMENT = +
      // ISSUE, DAMAGED, negative ADJUSTMENT = -
      // For this API, we assume 'quantity' is always positive and the 'type' determines direction
      const multiplier =
        type === 'RECEIPT' ||
        type === 'RETURN' ||
        (type === 'ADJUSTMENT' && body.isPositive !== false)
          ? 1
          : -1;
      const amountChange = quantity * multiplier;

      await tx.inventoryItem.update({
        where: { id: itemId },
        data: {
          quantity: { increment: amountChange },
        },
      });

      return movement;
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Inventory movement error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record inventory movement' },
      { status: 500 }
    );
  }
}
