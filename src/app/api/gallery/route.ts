import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const items = await prisma.portfolioItem.findMany({
      where: {
        isPublic: true,
        tailor: {
          showcaseEnabled: true,
          status: 'ACTIVE',
        },
      },
      include: {
        tailor: {
          select: {
            businessName: true,
            name: true,
            showcaseUsername: true,
            region: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: items.map((item) => ({
        id: item.id,
        title: item.title,
        category: item.category,
        image:
          item.images[0]?.split('?')[0] ||
          'https://images.unsplash.com/photo-1590540179852-c110309fa45a?auto=format&fit=crop&q=80&w=800',
        tailor: item.tailor.businessName || item.tailor.name,
        tailorUsername: item.tailor.showcaseUsername,
        region: item.tailor.region,
      })),
    });
  } catch (error) {
    console.error('Gallery API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch gallery items' },
      { status: 500 }
    );
  }
}
