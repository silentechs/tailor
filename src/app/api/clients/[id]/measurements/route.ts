import { NextResponse } from 'next/server';
import { requireActiveTailor } from '@/lib/direct-current-user';
import prisma from '@/lib/prisma';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/clients/[id]/measurements - Get last measurement for client
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireActiveTailor();
    const { id } = await params;

    const measurement = await prisma.clientMeasurement.findFirst({
      where: {
        clientId: id,
        client: {
          tailorId: user.id,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        template: {
          select: {
            name: true,
            garmentType: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: measurement,
    });
  } catch (error) {
    console.error('Get client measurements error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch client measurements' },
      { status: 500 }
    );
  }
}
