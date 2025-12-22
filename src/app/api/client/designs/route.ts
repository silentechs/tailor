import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireClient } from '@/lib/direct-current-user';
import prisma from '@/lib/prisma';

// Schema for uploading a design
const uploadDesignSchema = z.object({
    images: z.array(z.string()).min(1, 'At least one image is required'),
    notes: z.string().optional(),
    garmentType: z.enum([
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
    ]).optional(),
});

// GET /api/client/designs - List client's designs
export async function GET() {
    try {
        const user = await requireClient();

        // fetch user's linked client profiles
        const userWithClients = await prisma.user.findUnique({
            where: { id: user.id },
            include: { clientProfiles: { select: { id: true } } }
        });

        const clientIds = userWithClients?.clientProfiles.map(c => c.id) || [];

        const designs = await prisma.clientDesign.findMany({
            where: {
                OR: [
                    { userId: user.id },
                    { clientId: { in: clientIds } }
                ]
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ success: true, data: designs });
    } catch (error) {
        console.error('Get designs error:', error);
        if (error instanceof Error && error.message === 'Forbidden') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ success: false, error: 'Failed to fetch designs' }, { status: 500 });
    }
}

// POST /api/client/designs - Upload a design
export async function POST(request: Request) {
    try {
        const user = await requireClient();
        const body = await request.json();

        const validation = uploadDesignSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: 'Validation failed', details: validation.error.flatten() },
                { status: 400 }
            );
        }

        const { images, notes, garmentType } = validation.data;

        const design = await prisma.clientDesign.create({
            data: {
                userId: user.id,
                images,
                notes,
                garmentType,
            },
        });

        return NextResponse.json({ success: true, data: design }, { status: 201 });
    } catch (error) {
        console.error('Upload design error:', error);
        if (error instanceof Error && error.message === 'Forbidden') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ success: false, error: 'Failed to upload design' }, { status: 500 });
    }
}
