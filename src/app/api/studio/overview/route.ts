import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/direct-current-user';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const user = await requireUser();
    if (user.role !== 'CLIENT') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    if (!user.linkedClientId) {
      return NextResponse.json({
        success: true,
        data: {
          isLinked: false,
          orders: [],
          measurements: null,
          wishlistCount: 0,
        },
      });
    }

    const [orders, measurements, wishlistCount] = await Promise.all([
      prisma.order.findMany({
        where: { clientId: user.linkedClientId },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        include: { organization: { select: { name: true } } },
      }),
      prisma.clientMeasurement.findFirst({
        where: { clientId: user.linkedClientId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.wishlistItem.count({
        where: { userId: user.id },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        isLinked: true,
        orders,
        measurements,
        wishlistCount,
        summary: {
          activeOrders: orders.filter((o) => !['COMPLETED', 'CANCELLED'].includes(o.status)).length,
          lastMeasurement: measurements?.createdAt || null,
        },
      },
    });
  } catch (error) {
    console.error('Studio overview error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch studio overview' },
      { status: 500 }
    );
  }
}
