import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const trackLeadSchema = z.object({
    tailorId: z.string(),
    portfolioItemId: z.string().optional(),
    source: z.enum(['gallery', 'showcase', 'discover', 'direct', 'share']),
    channel: z.enum(['whatsapp', 'phone', 'inquiry_form']),
    visitorId: z.string().optional(),
    referrer: z.string().optional(),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validatedData = trackLeadSchema.parse(body);

        const lead = await prisma.lead.create({
            data: {
                tailorId: validatedData.tailorId,
                portfolioItemId: validatedData.portfolioItemId,
                source: validatedData.source,
                channel: validatedData.channel,
                visitorId: validatedData.visitorId,
                referrer: validatedData.referrer || request.headers.get('referer') || undefined,
            },
        });

        return NextResponse.json({ success: true, leadId: lead.id });
    } catch (error) {
        console.error('Error tracking lead:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid data', details: (error as any).errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
