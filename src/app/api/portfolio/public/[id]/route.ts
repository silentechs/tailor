import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const item = await prisma.portfolioItem.findFirst({
      where: {
        id,
        isPublic: true,
        tailor: {
          showcaseEnabled: true,
          status: 'ACTIVE',
        },
      },
      include: {
        tailor: {
          select: {
            name: true,
            businessName: true,
            profileImage: true,
            showcaseUsername: true,
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Portfolio item not found or private' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error('Get public portfolio item error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch portfolio item' },
      { status: 500 }
    );
  }
}
