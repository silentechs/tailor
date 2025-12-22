import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/direct-current-user';
import { sendFeedbackResponseEmail } from '@/lib/email-service';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for updating feedback
const updateFeedbackSchema = z.object({
  status: z
    .enum(['NEW', 'IN_REVIEW', 'IN_PROGRESS', 'RESPONDED', 'RESOLVED', 'CLOSED'])
    .optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  adminNotes: z.string().max(2000).optional().nullable(),
  response: z.string().min(10).max(2000).optional(), // Admin response to send via email
});

// GET /api/feedback/[id] - Get single feedback (admin only)
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;

    const feedback = await prisma.feedback.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            businessName: true,
            profileImage: true,
            phone: true,
            createdAt: true,
          },
        },
      },
    });

    if (!feedback) {
      return NextResponse.json({ success: false, error: 'Feedback not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: feedback });
  } catch (error) {
    console.error('Get feedback error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch feedback',
      },
      { status: error instanceof Error && error.message.includes('Forbidden') ? 403 : 500 }
    );
  }
}

// PATCH /api/feedback/[id] - Update feedback status/notes (admin only)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validation = updateFeedbackSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { status, priority, adminNotes, response } = validation.data;

    // Check if feedback exists
    const existing = await prisma.feedback.findUnique({
      where: { id },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Feedback not found' }, { status: 404 });
    }

    // Build update data
    const updateData: any = {};
    if (status) {
      updateData.status = status;
      if (status === 'RESPONDED') updateData.respondedAt = new Date();
      if (status === 'RESOLVED' || status === 'CLOSED') updateData.resolvedAt = new Date();
    }
    if (priority) updateData.priority = priority;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

    // Update feedback
    const feedback = await prisma.feedback.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            businessName: true,
            profileImage: true,
          },
        },
      },
    });

    // Send response email if provided
    if (response) {
      const recipientEmail = existing.user?.email || existing.email;
      const recipientName = existing.user?.name || existing.name || 'Valued User';

      if (recipientEmail) {
        await sendFeedbackResponseEmail(recipientEmail, {
          name: recipientName,
          subject: existing.subject,
          response,
          feedbackId: existing.id,
        });
      }
    }

    return NextResponse.json({ success: true, data: feedback });
  } catch (error) {
    console.error('Update feedback error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update feedback',
      },
      { status: error instanceof Error && error.message.includes('Forbidden') ? 403 : 500 }
    );
  }
}

// DELETE /api/feedback/[id] - Delete feedback (admin only)
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;

    const feedback = await prisma.feedback.findUnique({ where: { id } });

    if (!feedback) {
      return NextResponse.json({ success: false, error: 'Feedback not found' }, { status: 404 });
    }

    await prisma.feedback.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Feedback deleted successfully' });
  } catch (error) {
    console.error('Delete feedback error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete feedback',
      },
      { status: error instanceof Error && error.message.includes('Forbidden') ? 403 : 500 }
    );
  }
}

