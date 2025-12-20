import { NextResponse } from 'next/server';
import { requireActiveTailor } from '@/lib/direct-current-user';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const syncSchema = z.object({
    measurements: z.array(z.object({
        clientSideId: z.string(),
        clientId: z.string(),
        templateId: z.string().optional().nullable(),
        values: z.record(z.string(), z.any()),
        notes: z.string().optional().nullable(),
        sketch: z.string().optional().nullable(),
        createdAt: z.number(),
    })),
});

export async function POST(request: Request) {
    try {
        const user = await requireActiveTailor();
        const body = await request.json();
        const validation = syncSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
        }

        const { measurements } = validation.data;
        const results = [];

        for (const m of measurements) {
            try {
                // Upsert based on clientSideId to prevent duplicates
                const record = await prisma.clientMeasurement.upsert({
                    where: { clientSideId: m.clientSideId },
                    update: {
                        values: m.values,
                        notes: m.notes,
                        sketch: m.sketch,
                    },
                    create: {
                        clientSideId: m.clientSideId,
                        clientId: m.clientId,
                        templateId: m.templateId,
                        values: m.values,
                        notes: m.notes,
                        sketch: m.sketch,
                        createdAt: new Date(m.createdAt),
                        isSynced: true,
                    },
                });
                results.push({ clientSideId: m.clientSideId, serverId: record.id, status: 'synced' });
            } catch (err) {
                console.error(`Failed to sync measurement ${m.clientSideId}:`, err);
                results.push({ clientSideId: m.clientSideId, status: 'error', error: String(err) });
            }
        }

        return NextResponse.json({ success: true, results });
    } catch (error) {
        console.error('Batch sync error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
