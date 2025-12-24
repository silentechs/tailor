import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireActiveTailor } from '@/lib/direct-current-user';
import prisma from '@/lib/prisma';

// Default templates for Ghanaian garments
export const DEFAULT_TEMPLATES = [
  {
    name: 'Mens Shirt',
    garmentType: 'SHIRT',
    fields: ['chest', 'waist', 'shoulder', 'sleeve_length', 'shirt_length', 'neck'],
  },
  {
    name: 'Mens Trousers',
    garmentType: 'TROUSERS',
    fields: ['waist', 'hips', 'thigh', 'knee', 'bottom', 'length', 'inseam'],
  },
  {
    name: 'Kaba & Slit',
    garmentType: 'KABA_AND_SLIT',
    fields: [
      'bust',
      'under_bust',
      'waist',
      'hips',
      'shoulder',
      'sleeve_length',
      'kaba_length',
      'slit_length',
      'around_arm',
    ],
  },
  {
    name: 'Kaftan',
    garmentType: 'KAFTAN',
    fields: [
      'chest',
      'waist',
      'shoulder',
      'sleeve_length',
      'shirt_length',
      'neck',
      'trouser_length',
      'thigh',
    ],
  },
  {
    name: 'Agbada',
    garmentType: 'AGBADA',
    fields: [
      'chest',
      'shoulder',
      'agbada_length',
      'sleeve_length',
      'inner_shirt_chest',
      'trouser_length',
    ],
  },
  {
    name: 'Smock/Batakari',
    garmentType: 'SMOCK_BATAKARI',
    fields: ['chest', 'shoulder', 'length', 'neck', 'sleeve_length'],
  },
  {
    name: 'Dress/Gown',
    garmentType: 'DRESS',
    fields: [
      'bust',
      'waist',
      'hips',
      'shoulder',
      'sleeve_length',
      'full_length',
      'half_length',
      'waist_to_floor',
    ],
  },
  {
    name: 'Dashiki',
    garmentType: 'DASHIKI',
    fields: ['chest', 'shoulder', 'sleeve_length', 'shirt_length', 'neck'],
  },
  {
    name: 'Complet',
    garmentType: 'COMPLET',
    fields: ['chest', 'waist', 'shoulder', 'sleeve_length', 'shirt_length', 'trouser_waist', 'trouser_length', 'inseam'],
  },
  {
    name: 'Kente Cloth',
    garmentType: 'KENTE_CLOTH',
    fields: ['shoulder', 'chest', 'length', 'wrap_style'],
  },
  {
    name: 'Boubou',
    garmentType: 'BOUBOU',
    fields: ['chest', 'shoulder', 'sleeve_length', 'full_length', 'neck'],
  },
  {
    name: 'Suit',
    garmentType: 'SUIT',
    fields: ['chest', 'waist', 'shoulder', 'sleeve_length', 'jacket_length', 'trouser_waist', 'trouser_length', 'inseam'],
  },
  {
    name: 'Skirt',
    garmentType: 'SKIRT',
    fields: ['waist', 'hips', 'length', 'bottom_width'],
  },
  {
    name: 'Blouse',
    garmentType: 'BLOUSE',
    fields: ['bust', 'under_bust', 'waist', 'shoulder', 'sleeve_length', 'blouse_length'],
  },
  {
    name: 'Other',
    garmentType: 'OTHER',
    fields: ['chest', 'waist', 'hips', 'shoulder', 'length'],
  },
];

const createTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  garmentType: z.string(),
  fields: z.array(z.string()).min(1, 'At least one field is required'),
});

// GET /api/measurement-templates - List templates
export async function GET() {
  try {
    const user = await requireActiveTailor();

    const userTemplates = await prisma.measurementTemplate.findMany({
      where: { tailorId: user.id },
      orderBy: { name: 'asc' },
    });

    // Merge: user templates override defaults for the same garmentType
    const templateMap = new Map<string, { id?: string; name: string; garmentType: string; fields: string[] }>();

    // Add defaults first
    for (const defaultTemplate of DEFAULT_TEMPLATES) {
      templateMap.set(defaultTemplate.garmentType, defaultTemplate);
    }

    // User templates override defaults for matching garment types
    for (const userTemplate of userTemplates) {
      templateMap.set(userTemplate.garmentType, {
        id: userTemplate.id,
        name: userTemplate.name,
        garmentType: userTemplate.garmentType,
        fields: userTemplate.fields as string[],
      });
    }

    const combinedTemplates = Array.from(templateMap.values());

    return NextResponse.json({
      success: true,
      data: combinedTemplates,
    });
  } catch (error) {
    console.error('Get templates error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST /api/measurement-templates - Create a custom template
export async function POST(request: Request) {
  try {
    const user = await requireActiveTailor();
    const body = await request.json();

    const validation = createTemplateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { name, garmentType, fields } = validation.data;

    const template = await prisma.measurementTemplate.create({
      data: {
        tailorId: user.id,
        name,
        garmentType: garmentType as any,
        fields,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: template,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create template error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
