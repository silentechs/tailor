import { NextRequest, NextResponse } from 'next/server';
import { requireOrgMember } from '@/lib/require-permission';
import prisma from '@/lib/prisma';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ orgId: string }> }
) {
    try {
        const { orgId } = await params;
        await requireOrgMember(orgId);

        const members = await prisma.organizationMember.findMany({
            where: { organizationId: orgId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        profileImage: true,
                        role: true, // Primary User role
                    }
                }
            },
            orderBy: { role: 'asc' }
        });

        return NextResponse.json({ success: true, data: members });
    } catch (error) {
        console.error('[MEMBERS_GET]', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Internal error' },
            { status: error instanceof Error && error.message.includes('Forbidden') ? 403 : 500 }
        );
    }
}
