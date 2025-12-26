import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const tailors = await prisma.user.findMany({
      where: {
        showcaseEnabled: true,
        status: 'ACTIVE',
        showcaseUsername: { not: null },
      },
      select: {
        id: true,
        name: true,
        businessName: true,
        region: true,
        profileImage: true,
        bio: true,
        phone: true,
        showcaseUsername: true,
        portfolioItems: {
          where: { isPublic: true },
          take: 1,
          select: {
            category: true,
          },
        },
        orders: {
          where: {
            status: 'COMPLETED',
          },
          select: {
            ratings: {
              select: {
                rating: true,
              },
            },
          },
        },
        _count: {
          select: {
            portfolioItems: { where: { isPublic: true } },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: tailors.map((t) => {
        // Calculate average rating
        const allRatings = t.orders.flatMap((o) => o.ratings.map((r) => r.rating));
        const avgRating =
          allRatings.length > 0
            ? (allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1)
            : 'New';

        return {
          ...t,
          businessName: t.businessName || 'Unnamed Artisan',
          region: t.region || 'Unknown Region',
          specialty: t.portfolioItems[0]?.category || 'Bespoke Fashion Design',
          projectCount: t._count.portfolioItems,
          rating: avgRating,
        };
      }),
    });
  } catch (error) {
    console.error('Discover API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch tailors' }, { status: 500 });
  }
}
