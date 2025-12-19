import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireActiveTailor } from '@/lib/direct-current-user';
import prisma from '@/lib/prisma';

// Validation schema for draft data
const draftSchema = z.object({
  data: z.record(z.string(), z.unknown()),
  step: z.number().int().min(1).max(4).default(1),
});

// GET /api/bulk-order-drafts - Get all drafts for current tailor
export async function GET() {
  try {
    const user = await requireActiveTailor();

    const drafts = await prisma.bulkOrderDraft.findMany({
      where: { tailorId: user.id },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: drafts,
    });
  } catch (error) {
    console.error('Get drafts error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ success: false, error: 'Failed to fetch drafts' }, { status: 500 });
  }
}

// POST /api/bulk-order-drafts - Create a new draft
export async function POST(request: Request) {
  try {
    const user = await requireActiveTailor();
    const body = await request.json();

    const validationResult = draftSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { data, step } = validationResult.data;

    const draft = await prisma.bulkOrderDraft.create({
      data: {
        tailorId: user.id,
        data: data as object,
        step,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: draft,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create draft error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ success: false, error: 'Failed to create draft' }, { status: 500 });
  }
}
