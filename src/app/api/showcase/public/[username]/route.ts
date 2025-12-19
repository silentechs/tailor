import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

type RouteParams = { params: Promise<{ username: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { username } = await params;

    const tailor = await prisma.user.findUnique({
      where: {
        showcaseUsername: username,
        showcaseEnabled: true,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        businessName: true,
        businessAddress: true,
        region: true,
        city: true,
        profileImage: true,
        bio: true,
        portfolioItems: {
          where: { isPublic: true },
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: { likes: true },
            },
          },
        },
      },
    });

    if (!tailor) {
      return NextResponse.json(
        { success: false, error: 'Tailor not found or showcase is private' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: tailor,
    });
  } catch (error) {
    console.error('Get public showcase error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch showcase' },
      { status: 500 }
    );
  }
}
