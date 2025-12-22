import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/direct-current-user';
import prisma from '@/lib/prisma';

type RouteParams = { params: Promise<{ id: string }> };

// POST /api/portfolio/[id]/like - Toggle like on a portfolio item (public or private)
export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if item exists
    const item = await prisma.portfolioItem.findUnique({
      where: { id },
    });

    if (!item) {
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
    }

    // Check if already liked
    const existingLike = await prisma.portfolioLike.findUnique({
      where: {
        userId_portfolioItemId: {
          portfolioItemId: id,
          userId: user.id,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.$transaction([
        prisma.portfolioLike.delete({
          where: { id: existingLike.id },
        }),
        prisma.portfolioItem.update({
          where: { id },
          data: { likeCount: { decrement: 1 } },
        }),
      ]);
      return NextResponse.json({ success: true, liked: false });
    } else {
      // Like
      await prisma.$transaction([
        prisma.portfolioLike.create({
          data: {
            portfolioItemId: id,
            userId: user.id,
          },
        }),
        prisma.portfolioItem.update({
          where: { id },
          data: { likeCount: { increment: 1 } },
        }),
      ]);
      return NextResponse.json({ success: true, liked: true });
    }
  } catch (error) {
    console.error('Like portfolio item error:', error);
    return NextResponse.json({ success: false, error: 'Failed to like item' }, { status: 500 });
  }
}
