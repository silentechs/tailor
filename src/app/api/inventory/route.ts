import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireActiveTailor } from '@/lib/direct-current-user';
import prisma from '@/lib/prisma';

const inventoryItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  unitOfMeasure: z.string().default('YARDS'),
  quantity: z.number().default(0),
  minStock: z.number().default(0),
  unitCost: z.number().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
});

// GET /api/inventory - List inventory items
export async function GET(request: Request) {
  try {
    const user = await requireActiveTailor();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search') || '';

    const items = await prisma.inventoryItem.findMany({
      where: {
        tailorId: user.id,
        isActive: true,
        ...(category && { category }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error('Get inventory error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}

// POST /api/inventory - Add new inventory item
export async function POST(request: Request) {
  try {
    const user = await requireActiveTailor();
    const body = await request.json();

    const validation = inventoryItemSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const item = await prisma.$transaction(async (tx) => {
      const newItem = await tx.inventoryItem.create({
        data: {
          ...validation.data,
          tailorId: user.id,
          quantity: validation.data.quantity,
          minStock: validation.data.minStock,
        },
      });

      if (validation.data.quantity > 0) {
        await tx.inventoryMovement.create({
          data: {
            tailorId: user.id,
            itemId: newItem.id,
            type: 'ADJUSTMENT',
            quantity: validation.data.quantity,
            reason: 'Initial Stock',
          },
        });
      }

      return newItem;
    });

    return NextResponse.json(
      {
        success: true,
        data: item,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create inventory error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create inventory item' },
      { status: 500 }
    );
  }
}
