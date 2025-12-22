import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const ViewSchema = z.object({
  type: z.enum(['profile', 'portfolio_item']),
  id: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = ViewSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
    }

    const { type, id } = result.data;

    if (type === 'profile') {
      // Check if user exists first to be safe, or just updateMany (which won't fail if not found, but findUnique is correct)
      // Since it's an analytic event, we use update to atomically increment
      await prisma.user.update({
        where: { id },
        data: {
          profileViewCount: {
            increment: 1,
          },
        },
      });
    } else if (type === 'portfolio_item') {
      await prisma.portfolioItem.update({
        where: { id },
        data: {
          viewCount: {
            increment: 1,
          },
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics view error:', error);
    // Return 200 even on error to not break the client experience, or 500.
    // Usually analytics failure shouldn't block the UI, but here we return 500 for debugging.
    return NextResponse.json({ success: false, error: 'Failed to record view' }, { status: 500 });
  }
}
