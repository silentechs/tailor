import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateUser, createSession, updateSessionGeolocation } from '@/lib/direct-auth';
import prisma from '@/lib/prisma';
import { checkRateLimit, RATE_LIMIT_CONFIGS, rateLimitedResponse } from '@/lib/rate-limiter';
import { sanitizeEmail } from '@/lib/sanitize';
import { SECURITY_HEADERS } from '@/lib/security-headers';

// Validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: Request) {
  try {
    // Rate limiting - strict for auth routes
    const { allowed, headers: rateLimitHeaders } = checkRateLimit(
      request,
      '/api/auth/login',
      RATE_LIMIT_CONFIGS.auth
    );

    if (!allowed) {
      return rateLimitedResponse(rateLimitHeaders);
    }

    const body = await request.json();

    // Validate input
    const validationResult = loginSchema.safeParse(body);
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

    const { email: rawEmail, password } = validationResult.data;
    const email = sanitizeEmail(rawEmail);

    // Get request metadata
    const userAgent = request.headers.get('user-agent') || undefined;
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor?.split(',')[0] || undefined;

    // Authenticate user
    const authResult = await authenticateUser(email, password);

    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        {
          success: false,
          error: authResult.error,
        },
        { status: 401 }
      );
    }

    // Update user status to ACTIVE if APPROVED
    if (authResult.user.status === 'APPROVED') {
      await prisma.user.update({
        where: { id: authResult.user.id },
        data: { status: 'ACTIVE' },
      });
    }

    // Create session
    const { sessionId } = await createSession(authResult.user.id, userAgent, ipAddress);

    // Trigger async geolocation lookup (don't await - non-blocking)
    updateSessionGeolocation(sessionId, ipAddress).catch(err => {
      console.warn('Async geolocation update failed:', err);
    });

    // Determine redirect path based on role
    let redirectPath = '/dashboard';
    if (authResult.user.role === 'ADMIN') {
      redirectPath = '/admin/dashboard';
    } else if (authResult.user.role === 'CLIENT') {
      redirectPath = '/studio';
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        user: {
          id: authResult.user.id,
          email: authResult.user.email,
          name: authResult.user.name,
          role: authResult.user.role,
          status: authResult.user.status === 'APPROVED' ? 'ACTIVE' : authResult.user.status,
        },
        redirectPath,
      },
      { headers: SECURITY_HEADERS }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred',
      },
      { status: 500, headers: SECURITY_HEADERS }
    );
  }
}

