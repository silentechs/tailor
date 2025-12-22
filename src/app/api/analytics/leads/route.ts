import { NextResponse } from 'next/server';
import { requireOrganization } from '@/lib/require-permission';
import prisma from '@/lib/prisma';

// GET /api/analytics/leads - Get all clients marked as leads
export async function GET() {
    try {
        const { organizationId } = await requireOrganization();

        const leads = await prisma.client.findMany({
            where: {
                organizationId,
                isLead: true,
            },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: {
                        appointments: true,
                    },
                },
            },
        });

        return NextResponse.json({
            success: true,
            data: leads,
        });
    } catch (error) {
        console.error('Get leads error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch leads' },
            { status: 500 }
        );
    }
}
