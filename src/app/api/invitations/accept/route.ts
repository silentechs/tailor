import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/direct-current-user';
import { acceptInvitationSchema } from '@/lib/validations/organization';

/**
 * GET /api/invitations/accept?token=...
 * Validates an invitation token without changes.
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json({ success: false, error: 'Token is required' }, { status: 400 });
        }

        const invitation = await prisma.invitation.findUnique({
            where: { token },
            include: {
                organization: {
                    select: { name: true, slug: true }
                },
                invitedBy: {
                    select: { name: true }
                }
            }
        });

        if (!invitation || invitation.status !== 'PENDING') {
            return NextResponse.json({ success: false, error: 'Invalid or expired invitation' }, { status: 400 });
        }

        // Check if invitation is expired (e.g. older than 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        if (invitation.createdAt < sevenDaysAgo) {
            return NextResponse.json({ success: false, error: 'Invitation has expired' }, { status: 400 });
        }

        return NextResponse.json({ success: true, data: invitation });
    } catch (error) {
        console.error('[INVITATION_VALIDATE]', error);
        return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
    }
}

/**
 * POST /api/invitations/accept
 * Accepts an invitation and links the current user to the organization.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { token } = acceptInvitationSchema.parse(body);

        const invitation = await prisma.invitation.findUnique({
            where: { token },
            include: { organization: true }
        });

        if (!invitation || invitation.status !== 'PENDING') {
            return NextResponse.json({ success: false, error: 'Invalid or expired invitation' }, { status: 400 });
        }

        // User must be logged in to accept
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({
                success: false,
                error: 'Please log in or register to accept this invitation',
                requiresAuth: true
            }, { status: 401 });
        }

        const userId = user.id;
        const userRole = user.role;

        // Validation: Cannot accept own invitation
        if (invitation.invitedById === userId) {
            return NextResponse.json({
                success: false,
                error: 'You cannot accept an invitation you sent yourself.'
            }, { status: 400 });
        }

        // Validation: Email must match
        if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
            return NextResponse.json({
                success: false,
                error: `This invitation is for ${invitation.email}. You are logged in as ${user.email}.`
            }, { status: 400 });
        }

        // Execute in transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Check if already a member
            const existingMember = await tx.organizationMember.findUnique({
                where: {
                    organizationId_userId: {
                        organizationId: invitation.organizationId,
                        userId: userId
                    }
                }
            });

            if (existingMember) {
                // Just accept invitation if not already accepted
                await tx.invitation.update({
                    where: { id: invitation.id },
                    data: { status: 'ACCEPTED' }
                });
                return { alreadyMember: true };
            }

            // 2. Create membership
            await tx.organizationMember.create({
                data: {
                    organizationId: invitation.organizationId,
                    userId: userId,
                    role: invitation.role,
                }
            });

            // 3. Update invitation status
            await tx.invitation.update({
                where: { id: invitation.id },
                data: { status: 'ACCEPTED' }
            });

            // 4. Update user role if they are a standard WORKER/CLIENT
            // If they are a TAILOR/ADMIN, we don't change their primary role
            if (userRole !== 'ADMIN' && userRole !== 'TAILOR' && userRole !== 'SEAMSTRESS') {
                await tx.user.update({
                    where: { id: userId },
                    data: { role: 'WORKER' }
                });
            }

            return { alreadyMember: false };
        });

        return NextResponse.json({
            success: true,
            message: result.alreadyMember
                ? `You are already a member of ${invitation.organization.name}`
                : `Welcome to ${invitation.organization.name}!`,
            orgSlug: invitation.organization.slug
        });

    } catch (error) {
        console.error('[INVITATION_ACCEPT]', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Internal error' },
            { status: 500 }
        );
    }
}
