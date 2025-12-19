import { NextResponse } from 'next/server';
import { hashPassword, verifyPassword } from '@/lib/direct-auth';
import { getCurrentUser } from '@/lib/direct-current-user';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not authenticated',
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      businessName,
      phone,
      bio,
      notifyEmail,
      notifySms,
      showcaseEnabled,
      showcaseUsername,
      currentPassword,
      newPassword,
    } = body;

    const updateData: any = {};

    // Update profile fields if provided
    if (name) updateData.name = name;
    if (businessName) updateData.businessName = businessName;
    if (phone) updateData.phone = phone;
    if (bio !== undefined) updateData.bio = bio;
    if (notifyEmail !== undefined)
      updateData.notifyEmail = notifyEmail === true || notifyEmail === 'on';
    if (notifySms !== undefined) updateData.notifySms = notifySms === true || notifySms === 'on';

    // Showcase Settings
    if (showcaseEnabled !== undefined) {
      updateData.showcaseEnabled = showcaseEnabled === true || showcaseEnabled === 'on';
    }

    if (showcaseUsername !== undefined && showcaseUsername !== user.showcaseUsername) {
      const slug = showcaseUsername
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-]/g, '');
      if (slug.length < 3) {
        return NextResponse.json({ success: false, error: 'Username too short' }, { status: 400 });
      }

      // Check character uniqueness
      const existing = await prisma.user.findUnique({ where: { showcaseUsername: slug } });
      if (existing) {
        return NextResponse.json(
          { success: false, error: 'Username already taken' },
          { status: 400 }
        );
      }
      updateData.showcaseUsername = slug;
    }

    // Handle Password Update
    if (currentPassword && newPassword) {
      // Get user with password hash (getCurrentUser might exclude it)
      const fullUser = await prisma.user.findUnique({ where: { id: user.id } });
      if (!fullUser) throw new Error('User not found');

      const isValid = await verifyPassword(currentPassword, fullUser.password);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: 'Incorrect current password' },
          { status: 400 }
        );
      }

      updateData.password = await hashPassword(newPassword);
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
