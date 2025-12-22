import { NextResponse } from 'next/server';
import { requireActiveTailor } from '@/lib/direct-current-user';
import prisma from '@/lib/prisma';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/portfolio/[id] - Get a single portfolio item
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireActiveTailor();
    const { id } = await params;

    const item = await prisma.portfolioItem.findFirst({
      where: {
        id,
        tailorId: user.id,
      },
    });

    if (!item) {
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error('Get portfolio item error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch item' }, { status: 500 });
  }
}

// DELETE /api/portfolio/[id] - Delete a portfolio item
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireActiveTailor();
    const { id } = await params;

    const item = await prisma.portfolioItem.findFirst({
      where: {
        id,
        tailorId: user.id,
      },
    });

    if (!item) {
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
    }

    await prisma.portfolioItem.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Portfolio item deleted successfully',
    });
  } catch (error) {
    console.error('Delete portfolio item error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete item' }, { status: 500 });
  }
}

// PUT /api/portfolio/[id] - Update a portfolio item
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const user = await requireActiveTailor();
    const { id } = await params;
    const body = await request.json();

    const item = await prisma.portfolioItem.findFirst({
      where: {
        id,
        tailorId: user.id,
      },
    });

    if (!item) {
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
    }

    const updated = await prisma.portfolioItem.update({
      where: { id },
      data: {
        title: body.title,
        category: body.category,
        description: body.description,
        images: body.images,
        tags: body.tags,
        isPublic: body.isPublic,
        isFeatured: body.isFeatured,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Update portfolio item error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update item' }, { status: 500 });
  }
}

