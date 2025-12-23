import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireOrganization, requirePermission } from '@/lib/require-permission';

const updateSchema = z.object({
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  notes: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { organizationId } = await requireOrganization();
    await requirePermission('orders:write', organizationId);
    const body = await request.json();
    const { id } = await params;

    const validation = updateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: 'Validation failed' }, { status: 400 });
    }

    const appointment = await prisma.appointment.findFirst({
      where: { id, organizationId },
    });

    if (!appointment) {
      return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        ...validation.data,
        ...(validation.data.startTime && { startTime: new Date(validation.data.startTime) }),
        ...(validation.data.endTime && { endTime: new Date(validation.data.endTime) }),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update appointment error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update appointment' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { organizationId } = await requireOrganization();
    await requirePermission('orders:write', organizationId);

    const appointment = await prisma.appointment.findFirst({
      where: { id, organizationId },
    });

    if (!appointment) {
      return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 });
    }

    await prisma.appointment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Appointment deleted' });
  } catch (error) {
    console.error('Delete appointment error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete appointment' },
      { status: 500 }
    );
  }
}
