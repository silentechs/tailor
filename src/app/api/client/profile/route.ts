import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireClient } from '@/lib/direct-current-user';
import prisma from '@/lib/prisma';

// Schema for updating client profile/measurements
const updateProfileSchema = z.object({
  measurements: z.record(z.string(), z.any()).optional(),
  bio: z.string().optional(),
  name: z.string().optional(),
  phone: z.string().optional(),
});

// GET /api/client/profile - Get client profile
export async function GET() {
  try {
    const user = await requireClient();

    // Refresh user to get latest
    const freshUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        measurements: true,
        clientProfiles: {
          include: {
            tailor: {
              select: {
                businessName: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: freshUser });
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Failed to fetch profile' }, { status: 500 });
  }
}

// PUT /api/client/profile - Update measurements
export async function PUT(request: Request) {
  try {
    const user = await requireClient();
    const body = await request.json();

    const validation = updateProfileSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: 'Validation failed' }, { status: 400 });
    }

    const { measurements, bio, name, phone } = validation.data;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(measurements && { measurements }),
        ...(bio && { bio }),
        ...(name && { name }),
        ...(phone && { phone }),
      },
    });

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
