import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireActiveTailor } from '@/lib/direct-current-user';
import prisma from '@/lib/prisma';

const sketchSchema = z.object({
  sketch: z.string(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const user = await requireActiveTailor();
    const { id } = await params;
    const body = await request.json();

    const validation = sketchSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.format() },
        { status: 400 }
      );
    }

    // Verify measurement belongs to one of user's clients
    const measurement = await prisma.clientMeasurement.findUnique({
      where: { id },
      include: { client: true },
    });

    if (!measurement || measurement.client.tailorId !== user.id) {
      return NextResponse.json({ success: false, error: 'Measurement not found' }, { status: 404 });
    }

    const updated = await prisma.clientMeasurement.update({
      where: { id },
      data: {
        sketch: validation.data.sketch,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Save sketch error:', error);
    return NextResponse.json({ success: false, error: 'Failed to save sketch' }, { status: 500 });
  }
}
