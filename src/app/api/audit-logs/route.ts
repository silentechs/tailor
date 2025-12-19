import { NextResponse } from 'next/server';
import { getAuditLogs } from '@/lib/audit-service';
import { requireActiveTailor } from '@/lib/direct-current-user';

// GET /api/audit-logs - List audit logs for the current tailor
export async function GET(_request: Request) {
  try {
    const user = await requireActiveTailor();
    const logs = await getAuditLogs(user.id, 20);

    return NextResponse.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
