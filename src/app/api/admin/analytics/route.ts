import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-permission';
import prisma from '@/lib/prisma';
import { startOfMonth, endOfMonth, subMonths, format, startOfToday, subDays } from 'date-fns';

export async function GET(request: Request) {
    try {
        await requireAdmin();

        // 1. Revenue over the last 30 days
        const thirtyDaysAgo = subDays(startOfToday(), 30);
        const dailyRevenue = await prisma.order.findMany({
            where: {
                createdAt: { gte: thirtyDaysAgo },
                status: { not: 'CANCELLED' }
            },
            select: {
                totalAmount: true,
                createdAt: true,
            }
        });

        const revenueByDay: Record<string, number> = {};
        for (let i = 0; i < 30; i++) {
            const date = format(subDays(startOfToday(), i), 'MMM dd');
            revenueByDay[date] = 0;
        }

        dailyRevenue.forEach(order => {
            const date = format(order.createdAt, 'MMM dd');
            if (revenueByDay[date] !== undefined) {
                revenueByDay[date] += Number(order.totalAmount);
            }
        });

        const revenueTrend = Object.entries(revenueByDay)
            .reverse()
            .map(([date, amount]) => ({ date, amount }));

        // 2. Order Status Distribution
        const statusDistribution = await prisma.order.groupBy({
            by: ['status'],
            _count: { id: true }
        });

        // 3. Top Tailors by Revenue
        const topTailors = await prisma.user.findMany({
            where: { role: 'TAILOR' },
            select: {
                name: true,
                businessName: true,
                orders: {
                    where: { status: { not: 'CANCELLED' } },
                    select: { totalAmount: true }
                }
            },
            take: 5
        });

        const tailorPerformance = topTailors.map(tailor => ({
            name: tailor.businessName || tailor.name,
            revenue: tailor.orders.reduce((sum, order) => sum + Number(order.totalAmount), 0),
            orderCount: tailor.orders.length
        })).sort((a, b) => b.revenue - a.revenue);

        // 4. Regional Distribution
        const regionalDistribution = await prisma.user.groupBy({
            by: ['region'],
            _count: { id: true },
            where: { region: { not: null } }
        });

        return NextResponse.json({
            success: true,
            data: {
                revenueTrend,
                statusDistribution: statusDistribution.map(s => ({ name: s.status, value: s._count.id })),
                tailorPerformance,
                regionalDistribution: regionalDistribution.map(r => ({ name: r.region, value: r._count.id }))
            }
        });
    } catch (error) {
        console.error('Admin analytics error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch analytics' }, { status: 500 });
    }
}
