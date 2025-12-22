import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { getEmailLayout, sendEmail } from '@/lib/email-service';
import { captureError } from '@/lib/logger';
import prisma from '@/lib/prisma';
import { SECURITY_HEADERS } from '@/lib/security-headers';

const APP_URL =
  process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = forgotPasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    const { email } = result.data;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration attacks
    if (!user) {
      return NextResponse.json(
        { success: true, message: 'If an account exists, a reset link has been sent.' },
        { headers: SECURITY_HEADERS }
      );
    }

    // Delete any existing reset tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Create new reset token (expires in 1 hour)
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Send reset email
    const resetUrl = `${APP_URL}/auth/reset-password?token=${token}`;

    const emailContent = `
      <h2 style="color: #006B3F;">Reset Your Password</h2>
      <p>Dear ${user.name},</p>
      <p>We received a request to reset your password for your StitchCraft Ghana account.</p>
      <p>Click the button below to set a new password:</p>
      <div style="text-align: center;">
        <a href="${resetUrl}" class="btn">Reset Password</a>
      </div>
      <p style="margin-top: 30px; font-size: 14px; color: #666;">
        This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.
      </p>
      <p style="font-size: 12px; color: #999; margin-top: 20px;">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="${resetUrl}" style="color: #006B3F;">${resetUrl}</a>
      </p>
    `;

    await sendEmail({
      to: user.email,
      subject: 'Reset Your StitchCraft Password',
      html: getEmailLayout(emailContent, { subject: 'Reset Your Password' }),
      text: `Reset your password by visiting: ${resetUrl}. This link expires in 1 hour.`,
      template: 'password_reset',
    });

    return NextResponse.json(
      { success: true, message: 'If an account exists, a reset link has been sent.' },
      { headers: SECURITY_HEADERS }
    );
  } catch (error) {
    captureError('ForgotPasswordAPI', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500, headers: SECURITY_HEADERS }
    );
  }
}
