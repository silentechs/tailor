import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireOrganization, requirePermission } from '@/lib/require-permission';

// GET /api/communications/logs - Get SMS and Email notification logs
export async function GET() {
  try {
    const { user, organizationId } = await requireOrganization();
    await requirePermission('settings:read', organizationId);

    // SECURITY: These log tables are not tenant-scoped in the schema yet.
    // Until they are, only allow platform admins to view global delivery logs.
    if (user.role !== 'ADMIN') {
      return NextResponse.json({
        success: true,
        data: { sms: [], emails: [] },
        meta: { restricted: true },
      });
    }

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
