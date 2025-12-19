import { NextResponse } from 'next/server';
import { requireActiveTailor } from '@/lib/direct-current-user';
import prisma from '@/lib/prisma';

// GET /api/messages/conversations - List active conversations grouped by order
export async function GET(_request: Request) {
  try {
    const user = await requireActiveTailor();

    // Find orders that have messages
    // We want to list orders, and show the latest message for each
    const ordersWithMessages = await prisma.order.findMany({
      where: {
        tailorId: user.id,
        messages: {
          some: {}, // Only orders with at least one message
        },
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        client: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            message: true,
            createdAt: true,
            isRead: true,
            senderType: true,
          },
        },
        _count: {
          select: {
            messages: {
              where: {
                isRead: false,
                senderType: 'client', // Count unread messages from client
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Sort by latest message time
    const sortedConversations = ordersWithMessages.sort((a, b) => {
      const dateA = a.messages[0]?.createdAt ? new Date(a.messages[0].createdAt).getTime() : 0;
      const dateB = b.messages[0]?.createdAt ? new Date(b.messages[0].createdAt).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json({
      success: true,
      data: sortedConversations,
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}
