import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/direct-current-user';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const user = await requireUser();

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ success: true, data: notifications });
  } catch (error) {
    console.error('Studio notifications error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}
