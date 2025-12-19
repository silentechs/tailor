import { NextResponse } from 'next/server';
import { getCSRFToken } from '@/lib/csrf';
import { SECURITY_HEADERS } from '@/lib/security-headers';

// GET /api/csrf - Get CSRF token for forms
export async function GET() {
  try {
    const token = await getCSRFToken();

    return NextResponse.json(
      {
        success: true,
        csrfToken: token,
      },
      { headers: SECURITY_HEADERS }
    );
  } catch (error) {
    console.error('CSRF token error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate CSRF token',
      },
      { status: 500, headers: SECURITY_HEADERS }
    );
  }
}
