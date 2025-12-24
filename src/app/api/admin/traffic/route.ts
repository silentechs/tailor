import { NextResponse } from 'next/server';
import { getSession, canAccessAdmin } from '@/lib/direct-auth';
import prisma from '@/lib/prisma';
import { SECURITY_HEADERS } from '@/lib/security-headers';

export async function GET(request: Request) {
    try {
        // Verify admin access
        const session = await getSession();
        if (!session?.user || !canAccessAdmin(session.user.role)) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401, headers: SECURITY_HEADERS }
            );
        }

        // Parse query params
        const { searchParams } = new URL(request.url);
        const days = parseInt(searchParams.get('days') || '30');

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Fetch analytics data in parallel
        const [
            totalPageViews,
            totalClicks,
            uniqueVisitors,
            pageViewsByDay,
            topPages,
            topCountries,
            deviceBreakdown,
            browserBreakdown,
            recentEvents,
        ] = await Promise.all([
            // Total page views
            prisma.analyticsEvent.count({
                where: {
                    eventType: 'page_view',
                    createdAt: { gte: startDate },
                },
            }),

            // Total clicks
            prisma.analyticsEvent.count({
                where: {
                    eventType: 'click',
                    createdAt: { gte: startDate },
                },
            }),

            // Unique visitors (by session ID)
            prisma.analyticsEvent.groupBy({
                by: ['sessionId'],
                where: { createdAt: { gte: startDate } },
            }).then(r => r.length),

            // Page views by day (last 30 days)
            prisma.$queryRaw`
        SELECT 
          DATE("createdAt") as date,
          COUNT(*) as count
        FROM "AnalyticsEvent"
        WHERE "eventType" = 'page_view'
          AND "createdAt" >= ${startDate}
        GROUP BY DATE("createdAt")
        ORDER BY date DESC
        LIMIT 30
      ` as Promise<Array<{ date: Date; count: bigint }>>,

            // Top pages
            prisma.analyticsEvent.groupBy({
                by: ['path'],
                where: {
                    eventType: 'page_view',
                    createdAt: { gte: startDate },
                },
                _count: { path: true },
                orderBy: { _count: { path: 'desc' } },
                take: 10,
            }),

            // Top countries
            prisma.analyticsEvent.groupBy({
                by: ['country', 'countryCode'],
                where: {
                    createdAt: { gte: startDate },
                    country: { not: null },
                },
                _count: { country: true },
                orderBy: { _count: { country: 'desc' } },
                take: 10,
            }),

            // Device breakdown
            prisma.analyticsEvent.groupBy({
                by: ['deviceType'],
                where: {
                    createdAt: { gte: startDate },
                    deviceType: { not: null },
                },
                _count: { deviceType: true },
            }),

            // Browser breakdown
            prisma.analyticsEvent.groupBy({
                by: ['browser'],
                where: {
                    createdAt: { gte: startDate },
                    browser: { not: null },
                },
                _count: { browser: true },
                orderBy: { _count: { browser: 'desc' } },
                take: 5,
            }),

            // Recent events (for live feed)
            prisma.analyticsEvent.findMany({
                where: { createdAt: { gte: startDate } },
                orderBy: { createdAt: 'desc' },
                take: 20,
                select: {
                    id: true,
                    eventType: true,
                    eventName: true,
                    path: true,
                    country: true,
                    countryCode: true,
                    deviceType: true,
                    createdAt: true,
                },
            }),
        ]);

        // Format data
        const formattedPageViewsByDay = (pageViewsByDay as any[]).map(d => ({
            date: new Date(d.date).toISOString().split('T')[0],
            count: Number(d.count),
        })).reverse();

        const formattedTopPages = topPages.map(p => ({
            path: p.path,
            views: p._count.path,
        }));

        const formattedTopCountries = topCountries.map(c => ({
            country: c.country,
            countryCode: c.countryCode,
            visits: c._count.country,
        }));

        const formattedDeviceBreakdown = deviceBreakdown.map(d => ({
            name: d.deviceType || 'unknown',
            value: d._count.deviceType,
        }));

        const formattedBrowserBreakdown = browserBreakdown.map(b => ({
            name: b.browser || 'unknown',
            value: b._count.browser,
        }));

        return NextResponse.json(
            {
                success: true,
                data: {
                    summary: {
                        totalPageViews,
                        totalClicks,
                        uniqueVisitors,
                        avgPagesPerVisitor: uniqueVisitors > 0 ? Math.round(totalPageViews / uniqueVisitors * 10) / 10 : 0,
                    },
                    pageViewsByDay: formattedPageViewsByDay,
                    topPages: formattedTopPages,
                    topCountries: formattedTopCountries,
                    deviceBreakdown: formattedDeviceBreakdown,
                    browserBreakdown: formattedBrowserBreakdown,
                    recentEvents,
                },
            },
            { headers: SECURITY_HEADERS }
        );
    } catch (error) {
        console.error('Traffic analytics fetch error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch traffic analytics' },
            { status: 500, headers: SECURITY_HEADERS }
        );
    }
}
