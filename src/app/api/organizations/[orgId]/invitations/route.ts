import type { WorkerRole } from '@prisma/client';
import { type NextRequest, NextResponse } from 'next/server';
import { sendInvitationEmail } from '@/lib/email-service';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/require-permission';
import { createInvitationSchema } from '@/lib/validations/organization';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const { orgId } = await params;
    await requirePermission('workers:manage', orgId);

    const invitations = await prisma.invitation.findMany({
      where: {
        organizationId: orgId,
        status: 'PENDING',
      },
      orderBy: { createdAt: 'desc' },
      include: {
        invitedBy: {
          select: { name: true, email: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: invitations });
  } catch (error) {
    console.error('[INVITATIONS_GET]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal error' },
      { status: error instanceof Error && error.message.includes('Forbidden') ? 403 : 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const { orgId } = await params;
    const { user, organization } = await requirePermission('workers:manage', orgId);

    if (!organization) throw new Error('Organization not found');

    const body = await req.json();
    const validatedData = createInvitationSchema.parse(body);

    // Check if worker is already a member
    const existingMember = await prisma.organizationMember.findFirst({
      where: {
        organizationId: orgId,
        user: { email: validatedData.email.toLowerCase() },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { success: false, error: 'User is already a member of this organization' },
        { status: 400 }
      );
    }

    // Check for existing pending invitation
    const existingInvite = await prisma.invitation.findFirst({
      where: {
        organizationId: orgId,
        email: validatedData.email.toLowerCase(),
        status: 'PENDING',
      },
    });

    if (existingInvite) {
      return NextResponse.json(
        { success: false, error: 'An invitation is already pending for this email' },
        { status: 400 }
      );
    }

    // Create invitation with 7-day expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await prisma.invitation.create({
      data: {
        organizationId: orgId,
        email: validatedData.email.toLowerCase(),
        role: validatedData.role as WorkerRole,
        invitedById: user.id,
        expiresAt,
      },
    });

    // Send invitation email
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteUrl = `${baseUrl}/auth/accept-invitation?token=${invitation.token}`;

    await sendInvitationEmail(
      validatedData.email.toLowerCase(),
      user.name,
      organization.name,
      validatedData.role,
      inviteUrl
    );

    return NextResponse.json({ success: true, data: invitation }, { status: 201 });
  } catch (error) {
    console.error('[INVITATIONS_POST]', error);
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Invalid data', details: error },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal error' },
      { status: error instanceof Error && error.message.includes('Forbidden') ? 403 : 500 }
    );
  }
}
