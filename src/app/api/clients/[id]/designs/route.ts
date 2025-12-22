import { NextResponse } from 'next/server';
import { requireActiveTailor } from '@/lib/direct-current-user';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const clientDesignSchema = z.object({
    images: z.array(z.string().url()).min(1),
    notes: z.string().optional(),
    garmentType: z.string().optional().nullable(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await requireActiveTailor();
        const { id: clientId } = await params;
        const body = await req.json();

        const validation = clientDesignSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ success: false, error: 'Invalid data' }, { status: 400 });
        }

        const { images, notes, garmentType } = validation.data;

        // Verify client belongs to tailor
        const client = await prisma.client.findFirst({
            where: {
                id: clientId,
                tailorId: user.id
            }
        });

        if (!client) {
            return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
        }

        // Create the design attached to the CLIENT record (not necessarily a User)
        const design = await prisma.clientDesign.create({
            data: {
                clientId: client.id,
                images,
                notes,
                garmentType: garmentType as any,
                // We leave userId null if the client doesn't have a linked account
                // If they do have a linked account, we COULD link it, but for now
                // let's treat "Tailor uploads" as distinct from "Client uploads" 
                // unless we want them to show up in the client's own portal?
                // Let's link it to userId if it exists so the client can see what the tailor uploaded!
                userId: client.userId || undefined
            }
        });

        return NextResponse.json({ success: true, data: design });

    } catch (error) {
        console.error('Tailor design upload error:', error);
        return NextResponse.json({ success: false, error: 'Failed to save design' }, { status: 500 });
    }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await requireActiveTailor();
        const { id: clientId } = await params;

        // Verify client
        const client = await prisma.client.findFirst({
            where: {
                id: clientId,
                tailorId: user.id
            }
        });

        if (!client) {
            return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
        }

        // Fetch designs.
        // We want designs where clientId matches OR (userId matches AND userId is not null)
        // This gives us designs uploaded by the Tailor for this client 
        // AND designs uploaded by the Client themselves (if linked)
        const whereClause: any = {
            OR: [
                { clientId: clientId },
            ]
        };

        if (client.userId) {
            whereClause.OR.push({ userId: client.userId });
        }

        const designs = await prisma.clientDesign.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            include: {
                client: { select: { name: true } },
                user: { select: { name: true } }
            }
        });

        return NextResponse.json({ success: true, data: designs });

    } catch (error) {
        console.error('Get client designs error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch designs' }, { status: 500 });
    }
}
