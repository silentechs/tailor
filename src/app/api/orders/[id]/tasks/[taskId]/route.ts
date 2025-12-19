import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireActiveTailor } from '@/lib/direct-current-user';
import prisma from '@/lib/prisma';

const updateTaskSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  assignedTo: z.string().optional(),
});

type RouteParams = { params: Promise<{ id: string; taskId: string }> };

// PATCH /api/orders/[id]/tasks/[taskId] - Update a task
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const user = await requireActiveTailor();
    const { taskId } = await params;
    const body = await request.json();

    const validation = updateTaskSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.format() },
        { status: 400 }
      );
    }

    const existingTask = await prisma.orderTask.findUnique({
      where: { id: taskId },
    });

    if (!existingTask || existingTask.tailorId !== user.id) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    const data: any = { ...validation.data };
    if (data.status === 'IN_PROGRESS' && !existingTask.startedAt) {
      data.startedAt = new Date();
    }
    if (data.status === 'COMPLETED' && !existingTask.completedAt) {
      data.completedAt = new Date();
    }

    const task = await prisma.orderTask.update({
      where: { id: taskId },
      data,
    });

    return NextResponse.json({ success: true, data: task });
  } catch (error) {
    console.error('Update task error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update task' }, { status: 500 });
  }
}

// DELETE /api/orders/[id]/tasks/[taskId] - Delete a task
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireActiveTailor();
    const { taskId } = await params;

    const existingTask = await prisma.orderTask.findUnique({
      where: { id: taskId },
    });

    if (!existingTask || existingTask.tailorId !== user.id) {
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
