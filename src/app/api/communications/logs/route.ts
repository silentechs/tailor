import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireOrganization, requirePermission } from '@/lib/require-permission';

// GET /api/communications/logs - Get SMS and Email notification logs
export async function GET() {
  try {
    const { organizationId } = await requireOrganization();
    await requirePermission('settings:read', organizationId);

    // TODO: Add organizationId/tailorId to notification logs in schema.prisma
    // For now, we fetch recent logs. In a production multi-tenant app,
    // these MUST be filtered by organizationId.

    const [sms, emails] = await Promise.all([
      prisma.smsNotification.findMany({
        orderBy: { sentAt: 'desc' },
        take: 50,
      }),
      prisma.emailNotification.findMany({
        orderBy: { sentAt: 'desc' },
        take: 50,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        sms,
        emails,
      },
    });
  } catch (error) {
    console.error('Fetch communication logs error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch logs' },
      { status: error instanceof Error && error.message.includes('Forbidden') ? 403 : 500 }
    );
  }
}
