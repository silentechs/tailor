import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/require-permission';
import prisma from '@/lib/prisma';
import { sendInvitationEmail } from '@/lib/email-service';

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ orgId: string; inviteId: string }> }
) {
    try {
        const { orgId, inviteId } = await params;
        await requirePermission('workers:manage', orgId);

        const invitation = await prisma.invitation.findUnique({
            where: { id: inviteId }
        });

        if (!invitation) {
            return NextResponse.json({ success: false, error: 'Invitation not found' }, { status: 404 });
        }

        if (invitation.organizationId !== orgId) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        await prisma.invitation.delete({
            where: { id: inviteId }
        });

        return NextResponse.json({ success: true, message: 'Invitation revoked' });
    } catch (error) {
        console.error('[INVITATION_DELETE]', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Internal error' },
            { status: error instanceof Error && error.message.includes('Forbidden') ? 403 : 500 }
        );
    }
}
