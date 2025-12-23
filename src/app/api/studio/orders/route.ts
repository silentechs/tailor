import { NextResponse } from 'next/server';
import { generateOrderTimeline } from '@/lib/client-tracking-service';
import { requireUser } from '@/lib/direct-current-user';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const user = await requireUser();
    if (user.role !== 'CLIENT') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Return empty data if client is not linked to a tailor yet
    if (!user.linkedClientId) {
      return NextResponse.json({ success: true, data: [] });
    }

    const orders = await prisma.order.findMany({
      where: { clientId: user.linkedClientId },
      orderBy: { createdAt: 'desc' },
      include: {
        organization: {
          select: {
            name: true,
            logo: true,
            city: true,
          },
        },
        collection: {
          select: { name: true },
        },
      },
    });

    const ordersWithTimeline = orders.map((order) => ({
      ...order,
      timeline: generateOrderTimeline({
        status: order.status,
        createdAt: order.createdAt,
        startedAt: order.startedAt,
        completedAt: order.completedAt,
        deliveredAt: order.deliveredAt,
      }),
    }));

    return NextResponse.json({ success: true, data: ordersWithTimeline });
  } catch (error) {
    console.error('Studio orders error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch orders' }, { status: 500 });
  }
}
