import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/direct-current-user';
import { sendApprovalEmail, sendRejectionEmail } from '@/lib/email-service';
import prisma from '@/lib/prisma';

type RouteParams = { params: Promise<{ id: string }> };

// Validation schema for updating user status
const updateUserSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'ACTIVE', 'SUSPENDED', 'REJECTED']),
  reason: z.string().optional(),
});

// GET /api/admin/users/[id] - Get user details
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        businessName: true,
        businessAddress: true,
        region: true,
        city: true,
        profileImage: true,
        bio: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            clients: true,
            orders: true,
            payments: true,
            portfolioItems: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        stats: {
          clients: user._count.clients,
          orders: user._count.orders,
          payments: user._count.payments,
          portfolioItems: user._count.portfolioItems,
        },
        _count: undefined,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);

    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ success: false, error: 'Failed to fetch user' }, { status: 500 });
  }
}

// PUT /api/admin/users/[id] - Update user status (approve/reject/suspend)
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    const validationResult = updateUserSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { status, reason } = validationResult.data;

    // Get current user
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Don't allow modifying admin users
    if (existingUser.role === 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Cannot modify admin users' },
        { status: 400 }
      );
    }

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
      },
    });

    // Send email notifications
    const appUrl = process.env.APP_URL || 'http://localhost:3000';

    if (status === 'APPROVED' && existingUser.status === 'PENDING') {
      await sendApprovalEmail(user.email, user.name, `${appUrl}/auth/login`);
    }

    if (status === 'REJECTED') {
      await sendRejectionEmail(user.email, user.name, reason);
    }

    return NextResponse.json({
      success: true,
      data: user,
      message: `User ${status.toLowerCase()} successfully`,
    });
  } catch (error) {
    console.error('Update user error:', error);

    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ success: false, error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE /api/admin/users/[id] - Delete a user
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Don't allow deleting admin users
    if (existingUser.role === 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete admin users' },
        { status: 400 }
      );
    }

    // Delete user (cascades to related data)
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);

    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ success: false, error: 'Failed to delete user' }, { status: 500 });
  }
}
