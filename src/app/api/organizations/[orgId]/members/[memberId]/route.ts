import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/require-permission';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { WorkerRole } from '@prisma/client';

const updateMemberSchema = z.object({
    role: z.nativeEnum(WorkerRole).optional(),
    permissions: z.array(z.string()).optional(),
});

type RouteParams = { params: Promise<{ orgId: string; memberId: string }> };

export async function PUT(req: NextRequest, { params }: RouteParams) {
    try {
        const { orgId, memberId } = await params;
        const { user } = await requirePermission('workers:manage', orgId);

        const body = await req.json();
        const { role, permissions } = updateMemberSchema.parse(body);

        // Check if member exists
        const member = await prisma.organizationMember.findUnique({
            where: { id: memberId },
            include: { user: true }
        });

        if (!member) {
            return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 });
        }

        if (member.organizationId !== orgId) {
            return NextResponse.json({ success: false, error: 'Member does not belong to this organization' }, { status: 400 });
        }

        // Prevent modifying own role/permissions to avoid locking oneself out (unless Admin/Owner logic handles it, but let's be safe)
        if (member.userId === user.id) {
            return NextResponse.json({ success: false, error: 'Cannot modify your own permissions' }, { status: 400 });
        }

        const updatedMember = await prisma.organizationMember.update({
            where: { id: memberId },
            data: {
                ...(role && { role }),
                ...(permissions && { permissions })
            }
        });

        return NextResponse.json({ success: true, data: updatedMember });

    } catch (error) {
        console.error('[MEMBER_UPDATE]', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ success: false, error: 'Invalid data', details: error.flatten() }, { status: 400 });
        }
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Internal error' },
            { status: error instanceof Error && error.message.includes('Forbidden') ? 403 : 500 }
        );
    }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
    try {
        const { orgId, memberId } = await params;
        const { user } = await requirePermission('workers:manage', orgId);

        const member = await prisma.organizationMember.findUnique({
            where: { id: memberId }
        });

        if (!member) {
            return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 });
        }

        if (member.organizationId !== orgId) {
            return NextResponse.json({ success: false, error: 'Member does not belong to this organization' }, { status: 400 });
        }

        if (member.userId === user.id) {
            return NextResponse.json({ success: false, error: 'Cannot remove yourself' }, { status: 400 });
        }

        await prisma.organizationMember.delete({
            where: { id: memberId }
        });

        return NextResponse.json({ success: true, message: 'Member removed successfully' });

    } catch (error) {
        console.error('[MEMBER_DELETE]', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Internal error' },
            { status: error instanceof Error && error.message.includes('Forbidden') ? 403 : 500 }
        );
    }
}
