import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/direct-current-user';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// POST schema
const sendMessageSchema = z.object({
    orderId: z.string().min(1),
    content: z.string().min(1),
});

export async function GET() {
    try {
        const user = await requireUser();
        if (user.role !== 'CLIENT' || !user.linkedClientId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch orders that have messages, OR all orders to start new chats
        const orders = await prisma.order.findMany({
            where: { clientId: user.linkedClientId },
            orderBy: { updatedAt: 'desc' },
            select: {
                id: true,
                orderNumber: true,
                garmentType: true,
                status: true,
                messages: {
                    orderBy: { createdAt: 'asc' },
                    select: {
                        id: true,
                        message: true,
                        createdAt: true,
                        senderType: true,
                        senderId: true,
                        isRead: true,
                    }
                },
                organization: {
                    select: { name: true, logo: true }
                }
            }
        });

        return NextResponse.json({ success: true, data: orders });

    } catch (error) {
        console.error('Get messages error:', error);
        return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const user = await requireUser();
        if (user.role !== 'CLIENT' || !user.linkedClientId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { orderId, content } = sendMessageSchema.parse(body);

        // Verify ownership
        const order = await prisma.order.findFirst({
            where: { id: orderId, clientId: user.linkedClientId }
        });

        if (!order) {
            return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
        }

        const message = await prisma.orderMessage.create({
            data: {
                orderId,
                senderId: user.id,
                senderType: 'CLIENT',
                message: content,
            }
        });

        return NextResponse.json({ success: true, data: message });

    } catch (error) {
        console.error('Send message error:', error);
        return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
    }
}
