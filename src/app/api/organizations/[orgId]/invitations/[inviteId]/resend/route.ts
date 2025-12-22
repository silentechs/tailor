import { randomUUID } from 'node:crypto';
import { type NextRequest, NextResponse } from 'next/server';
import { logAudit } from '@/lib/audit-service';
import { sendInvitationEmail } from '@/lib/email-service';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/require-permission';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ orgId: string; inviteId: string }> }
) {
  try {
    const { orgId, inviteId } = await params;
    const { user, organization } = await requirePermission('workers:manage', orgId);

    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    const invitation = await prisma.invitation.findUnique({
      where: { id: inviteId },
      include: { invitedBy: { select: { name: true } } },
    });

    if (!invitation) {
      return NextResponse.json({ success: false, error: 'Invitation not found' }, { status: 404 });
    }

    if (invitation.organizationId !== orgId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    if (invitation.status !== 'PENDING' && invitation.status !== 'EXPIRED') {
      return NextResponse.json(
        { success: false, error: 'Only pending or expired invitations can be resent' },
        { status: 400 }
      );
    }

    // Rate limiting: Check if resent in the last 60 seconds
    const oneMinuteAgo = new Date(Date.now() - 60000);
    if (invitation.updatedAt && invitation.updatedAt > oneMinuteAgo) {
      return NextResponse.json(
        { success: false, error: 'Please wait a minute before resending again' },
        { status: 429 }
      );
    }

    // 1. Generate FRESH TOKEN (Security: invalidate old link)
    const newToken = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const updatedInvitation = await prisma.invitation.update({
      where: { id: inviteId },
      data: {
        token: newToken,
        expiresAt,
        createdAt: new Date(), // Update "Sent" time for UI
        status: 'PENDING',
      },
    });

    // 2. Re-trigger email with NEW link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteUrl = `${baseUrl}/auth/accept-invitation?token=${updatedInvitation.token}`;

    await sendInvitationEmail(
      updatedInvitation.email.toLowerCase(),
      user.name, // Use the person CURRENTLY resending (matches Asset360 pattern)
      organization.name,
      updatedInvitation.role,
      inviteUrl
    );

    // 3. Audit Log
    await logAudit({
      userId: user.id,
      action: 'INVITATION_RESENT',
      resource: 'INVITATION',
      resourceId: inviteId,
      details: {
        email: invitation.email,
        oldToken: invitation.token,
        newToken: newToken,
      },
    });

    return NextResponse.json({ success: true, data: updatedInvitation });
  } catch (error) {
    console.error('[INVITATION_RESEND_POST]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal error' },
      { status: error instanceof Error && error.message.includes('Forbidden') ? 403 : 500 }
    );
  }
}
