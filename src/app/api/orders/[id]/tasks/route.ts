import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireActiveTailor } from '@/lib/direct-current-user';
import prisma from '@/lib/prisma';

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
});

const _updateTaskSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  assignedTo: z.string().optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/orders/[id]/tasks - Get all tasks for an order
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireActiveTailor();
    const { id: orderId } = await params;

    const tasks = await prisma.orderTask.findMany({
      where: {
        orderId,
        tailorId: user.id,
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
    const user = await requireActiveTailor();
    const { id: orderId } = await params;
    const body = await request.json();

    const validation = createTaskSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.format() },
        { status: 400 }
      );
    }

    // Verify order belongs to tailor
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.tailorId !== user.id) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const task = await prisma.orderTask.create({
      data: {
        ...validation.data,
        orderId,
        tailorId: user.id,
      },
    });

    return NextResponse.json({ success: true, data: task }, { status: 201 });
  } catch (error) {
    console.error('Create task error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create task' }, { status: 500 });
  }
}
