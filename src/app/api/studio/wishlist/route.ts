import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/direct-current-user';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'CLIENT') {
      return NextResponse.json({ success: false, error: 'Clients only' }, { status: 403 });
    }

    const wishlist = await prisma.wishlistItem.findMany({
      where: { userId: user.id },
      include: {
        portfolioItem: {
          include: {
            organization: {
              select: { name: true, slug: true },
            },
            tailor: {
              select: { showcaseUsername: true, businessName: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: wishlist });
  } catch (error) {
    console.error('Studio wishlist error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch wishlist' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'CLIENT') {
      return NextResponse.json({ success: false, error: 'Clients only' }, { status: 403 });
    }

    const { portfolioItemId } = await req.json();
    if (!portfolioItemId) {
      return NextResponse.json(
        { success: false, error: 'Portfolio Item ID required' },
        { status: 400 }
      );
    }

    // Check if exists
    const existing = await prisma.wishlistItem.findFirst({
      where: {
        userId: user.id,
        portfolioItemId: portfolioItemId,
      },
    });

    if (existing) {
      // Remove
      await prisma.wishlistItem.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ success: true, action: 'removed' });
    } else {
      // Add
      await prisma.wishlistItem.create({
        data: {
          userId: user.id,
          portfolioItemId: portfolioItemId,
        },
      });
      return NextResponse.json({ success: true, action: 'added' });
    }
  } catch (error) {
    console.error('Studio wishlist toggle error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to toggle wishlist' },
      { status: 500 }
    );
  }
}

