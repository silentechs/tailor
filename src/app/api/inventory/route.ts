import { NextResponse } from 'next/server';
import { registry, z } from '@/lib/api-docs';
import prisma from '@/lib/prisma';
import { requireOrganization, requirePermission } from '@/lib/require-permission';

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

// Register InventoryItem Schema
registry.register('InventoryItem', inventoryItemSchema);

// Register GET /inventory
registry.registerPath({
  method: 'get',
  path: '/inventory',
  summary: 'List inventory items',
  description: 'Returns a paginated list of inventory items.',
  security: [{ cookieAuth: [] }, { bearerAuth: [] }],
  responses: {
    200: {
      description: 'Success',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.array(z.any()),
          }),
        },
      },
    },
  },
});

// Register POST /inventory
registry.registerPath({
  method: 'post',
  path: '/inventory',
  summary: 'Add new inventory item',
  description: 'Adds a new item to the inventory.',
  security: [{ cookieAuth: [] }, { bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: inventoryItemSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Item created successfully',
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

// GET /api/inventory - List inventory items
export async function GET(request: Request) {
  try {
    const { organizationId } = await requireOrganization();
    await requirePermission('inventory:read', organizationId);

    // Fetch organization to get ownerId for broader compatibility if needed (optional optimization)
    // For now, filtering by organizationId is the correct rigorous approach.
    // If legacy data handling is needed, we would need the ownerId.

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search') || '';

    const items = await prisma.inventoryItem.findMany({
      where: {
        organizationId, // Scope to organization
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

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}

// POST /api/inventory - Add new inventory item
export async function POST(request: Request) {
  try {
    const { user, organizationId } = await requireOrganization();
    await requirePermission('inventory:write', organizationId);
    const body = await request.json();

    const validation = inventoryItemSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    // We need the organization owner ID for the required 'tailorId' field
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { ownerId: true },
    });

    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    const item = await prisma.$transaction(async (tx) => {
      const newItem = await tx.inventoryItem.create({
        data: {
          ...validation.data,
          organizationId,
          tailorId: organization.ownerId, // Set owner correctly
          quantity: validation.data.quantity,
          minStock: validation.data.minStock,
        },
      });

      if (validation.data.quantity > 0) {
        await tx.inventoryMovement.create({
          data: {
            tailorId: user.id, // The specific user who made the adjustment
            organizationId,
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

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create inventory item' },
      { status: 500 }
    );
  }
}
