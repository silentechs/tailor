import { NextResponse } from 'next/server';
import { requireActiveTailor } from '@/lib/direct-current-user';
import { notifyOrderStatusChange } from '@/lib/notification-service';
import prisma from '@/lib/prisma';

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const user = await requireActiveTailor();
    const { id: orderId } = await params;
    const body = await request.json();
    const { type } = body;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        client: true,
      },
    });

    if (!order || order.tailorId !== user.id) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    if (type === 'INVOICE') {
      await notifyOrderStatusChange(
        user.id,
        order.client.phone,
        order.client.email || null,
        order.orderNumber,
        order.client.name,
        order.status,
        true, // notifySms
        true // notifyEmail
      );
      return NextResponse.json({ success: true, message: 'Invoice notification sent' });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid notification type' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Notify error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
