import { NextResponse } from 'next/server';
import { requireActiveTailor } from '@/lib/direct-current-user';
import prisma from '@/lib/prisma';

// GET /api/communications/logs - Get SMS and Email notification logs
export async function GET() {
    try {
        const user = await requireActiveTailor();

        // Since we don't have organizationId on individual notification logs yet,
        // we filter by tailorId indirectly if possible, but the current schema
        // for SmsNotification and EmailNotification doesn't have tailorId.
        // For now, we'll fetch all if the user is a Tailor (multi-tenancy gap here to fix later).

        // TODO: Add organizationId/tailorId to notification logs in schema.prisma

        const [sms, emails] = await Promise.all([
            prisma.smsNotification.findMany({
                orderBy: { sentAt: 'desc' },
                take: 50
            }),
            prisma.emailNotification.findMany({
                orderBy: { sentAt: 'desc' },
                take: 50
            })
        ]);

        return NextResponse.json({
            success: true,
            data: {
                sms,
                emails
            }
        });
    } catch (error) {
        console.error('Fetch communication logs error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch logs' }, { status: 500 });
    }
}
