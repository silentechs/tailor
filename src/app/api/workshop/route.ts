import { NextResponse } from 'next/server';
import { requirePermission, requireOrganization } from '@/lib/require-permission';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const { organizationId } = await requireOrganization();
    await requirePermission('orders:read', organizationId);

    const orders = await prisma.order.findMany({
      where: {
        organizationId,
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
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch workshop queue' },
      { status: error instanceof Error && error.message.includes('Forbidden') ? 403 : 500 }
    );
  }
}
