import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { captureError } from '@/lib/logger';
import prisma from '@/lib/prisma';
import { SECURITY_HEADERS } from '@/lib/security-headers';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = resetPasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.issues[0].message },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    const { token, password } = result.data;

    // Find valid reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired reset link' },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    // Check if token is expired
    if (resetToken.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
      return NextResponse.json(
        { success: false, error: 'Reset link has expired. Please request a new one.' },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    // Check if token was already used
    if (resetToken.usedAt) {
      return NextResponse.json(
        { success: false, error: 'This reset link has already been used.' },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update password and mark token as used in a transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      // Invalidate all existing sessions for security
      prisma.session.deleteMany({
        where: { userId: resetToken.userId },
      }),
    ]);

    return NextResponse.json(
      { success: true, message: 'Password has been reset successfully' },
      { headers: SECURITY_HEADERS }
    );
  } catch (error) {
    captureError('ResetPasswordAPI', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset password' },
      { status: 500, headers: SECURITY_HEADERS }
    );
  }
}

// GET - Validate token without using it
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, valid: false, error: 'Token is required' },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return NextResponse.json(
        { success: true, valid: false, error: 'Invalid reset link' },
        { headers: SECURITY_HEADERS }
      );
    }

    if (resetToken.expiresAt < new Date()) {
      return NextResponse.json(
        { success: true, valid: false, error: 'Reset link has expired' },
        { headers: SECURITY_HEADERS }
      );
    }

    if (resetToken.usedAt) {
      return NextResponse.json(
        { success: true, valid: false, error: 'Reset link has already been used' },
        { headers: SECURITY_HEADERS }
      );
    }

    return NextResponse.json({ success: true, valid: true }, { headers: SECURITY_HEADERS });
  } catch (error) {
    captureError('ResetPasswordAPI:Validate', error);
    return NextResponse.json(
      { success: false, valid: false, error: 'Failed to validate token' },
      { status: 500, headers: SECURITY_HEADERS }
    );
  }
}
