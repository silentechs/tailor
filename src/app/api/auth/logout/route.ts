import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/direct-auth';

export async function POST() {
  try {
    await destroySession();

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    await destroySession();

    // Redirect to login page after logout
    const baseUrl = new URL(request.url).origin;
    return NextResponse.redirect(`${baseUrl}/login`);
  } catch (error) {
    console.error('Logout GET error:', error);
    const baseUrl = new URL(request.url).origin;
    return NextResponse.redirect(`${baseUrl}/login`);
  }
}
