import { NextResponse } from 'next/server';
import { z } from 'zod';
import { registerUser } from '@/lib/direct-auth';
import { sendRegistrationEmail } from '@/lib/email-service';
import { checkRateLimit, RATE_LIMIT_CONFIGS, rateLimitedResponse } from '@/lib/rate-limiter';
import { sanitizeEmail, sanitizePhone, sanitizeString } from '@/lib/sanitize';
import { SECURITY_HEADERS } from '@/lib/security-headers';
import { isValidGhanaPhone } from '@/lib/utils';

// Validation schema
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || isValidGhanaPhone(val), 'Invalid Ghana phone number'),
  businessName: z.string().optional(),
  role: z.enum(['TAILOR', 'SEAMSTRESS', 'CLIENT']),
  region: z.string().optional(),
  city: z.string().optional(),
  trackingToken: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    // Rate limiting - strict for registration
    const { allowed, headers: rateLimitHeaders } = checkRateLimit(
      request,
      '/api/auth/register',
      RATE_LIMIT_CONFIGS.auth
    );

    if (!allowed) {
      return rateLimitedResponse(rateLimitHeaders);
    }

    const body = await request.json();

    // Validate input
    const validationResult = registerSchema.safeParse(body);
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

    const rawData = validationResult.data;

    // Sanitize input
    const data = {
      ...rawData,
      email: sanitizeEmail(rawData.email),
      name: sanitizeString(rawData.name),
      phone: rawData.phone ? sanitizePhone(rawData.phone) : undefined,
      businessName: rawData.businessName ? sanitizeString(rawData.businessName) : undefined,
      city: rawData.city ? sanitizeString(rawData.city) : undefined,
    };

    // Register user
    const result = await registerUser(data);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    // Send notification email to admin
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail && result.user) {
      await sendRegistrationEmail(result.user.email, result.user.name, adminEmail);
    }

    return NextResponse.json(
      {
        success: true,
        message:
          'Registration successful! Your account is pending approval. You will receive an email once approved.',
        user: {
          id: result.user!.id,
          email: result.user!.email,
          name: result.user!.name,
          role: result.user!.role,
          status: result.user!.status,
        },
      },
      { status: 201, headers: SECURITY_HEADERS }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred',
      },
      { status: 500, headers: SECURITY_HEADERS }
    );
  }
}
