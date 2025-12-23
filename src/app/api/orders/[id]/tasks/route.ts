import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireOrganization, requirePermission } from '@/lib/require-permission';

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  materialId: z.string().min(1).nullable().optional(),
  materialQty: z.number().nullable().optional(),
});

const _updateTaskSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  assignedTo: z.string().optional(),
  materialId: z.string().nullable().optional(),
  materialQty: z.number().nullable().optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/orders/[id]/tasks - Get all tasks for an order
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { organizationId } = await requireOrganization();
    await requirePermission('tasks:read', organizationId);

    const { id: orderId } = await params;

    const tasks = await prisma.orderTask.findMany({
      where: {
        orderId,
        organizationId,
      },
      include: {
        material: {
          select: {
            name: true,
            unitOfMeasure: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ success: true, data: tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

// POST /api/orders/[id]/tasks - Create a new task for an order
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { user, organizationId } = await requireOrganization();
    await requirePermission('tasks:write', organizationId);

    const { id: orderId } = await params;
    const body = await request.json();

    const validation = createTaskSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.format() },
        { status: 400 }
      );
    }

    if (validation.data.materialQty != null && !validation.data.materialId) {
      return NextResponse.json(
        { success: false, error: 'materialId is required when materialQty is provided' },
        { status: 400 }
      );
    }

    // Verify order belongs to organization
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.organizationId !== organizationId) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
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

    const task = await prisma.orderTask.create({
      data: {
        ...validation.data,
        orderId,
        organizationId,
        tailorId: user.id, // Creator
      },
    });

    return NextResponse.json({ success: true, data: task }, { status: 201 });
  } catch (error) {
    console.error('Create task error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create task' }, { status: 500 });
  }
}
