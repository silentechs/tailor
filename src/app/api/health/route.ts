import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/health - Health check endpoint
export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: 'unknown',
      email: process.env.RESEND_API_KEY ? 'configured' : 'not_configured',
      sms: {
        hubtel: process.env.HUBTEL_CLIENT_ID ? 'configured' : 'not_configured',
        termii: process.env.TERMII_API_KEY ? 'configured' : 'not_configured',
        hub2sms: process.env.HUB2SMS_API_KEY ? 'configured' : 'not_configured',
      },
    },
  };

  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    health.services.database = 'connected';
  } catch (_error) {
    health.status = 'degraded';
    health.services.database = 'disconnected';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;

  return NextResponse.json(health, { status: statusCode });
}
