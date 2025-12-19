import type { GarmentType, Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireActiveTailor } from '@/lib/direct-current-user';
import prisma from '@/lib/prisma';

// Validation schema for creating a portfolio item
const createPortfolioSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().optional().nullable(),
  category: z.enum([
    'KABA_AND_SLIT',
    'DASHIKI',
    'SMOCK_BATAKARI',
    'KAFTAN',
    'AGBADA',
    'COMPLET',
    'KENTE_CLOTH',
    'BOUBOU',
    'SUIT',
    'DRESS',
    'SHIRT',
    'TROUSERS',
    'SKIRT',
    'BLOUSE',
    'OTHER',
  ]),
  images: z.array(z.string()).min(1, 'At least one image is required'),
  tags: z.array(z.string()).optional().default([]),
  isPublic: z.boolean().optional().default(true),
  isFeatured: z.boolean().optional().default(false),
});

// GET /api/portfolio - List portfolio items
export async function GET(request: Request) {
  try {
    const user = await requireActiveTailor();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '12', 10);
    const category = searchParams.get('category');

    const where: Prisma.PortfolioItemWhereInput = {
      tailorId: user.id,
      ...(category && { category: category as GarmentType }),
    };

    const total = await prisma.portfolioItem.count({ where });

    const items = await prisma.portfolioItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      success: true,
      data: items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Get portfolio error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch portfolio' },
      { status: 500 }
    );
  }
}

// POST /api/portfolio - Create portfolio item
export async function POST(request: Request) {
  try {
    const user = await requireActiveTailor();
    const body = await request.json();

    const validationResult = createPortfolioSchema.safeParse(body);
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

    const data = validationResult.data;

    const item = await prisma.portfolioItem.create({
      data: {
        tailorId: user.id,
        title: data.title,
        description: data.description,
        category: data.category,
        images: data.images,
        tags: data.tags,
        isPublic: data.isPublic,
        isFeatured: data.isFeatured,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: item,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create portfolio item error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create portfolio item' },
      { status: 500 }
    );
  }
}
