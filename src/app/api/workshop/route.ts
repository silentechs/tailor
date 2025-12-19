import { NextResponse } from 'next/server';
import { requireActiveTailor } from '@/lib/direct-current-user';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const user = await requireActiveTailor();

    const orders = await prisma.order.findMany({
      where: {
        tailorId: user.id,
        status: {
          in: ['CONFIRMED', 'IN_PROGRESS', 'READY_FOR_FITTING', 'FITTING_DONE'],
        },
      },
      orderBy: [{ deadline: 'asc' }, { createdAt: 'asc' }],
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        measurement: true,
        tasks: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error('Workshop queue error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch workshop queue' },
      { status: 500 }
    );
  }
}
