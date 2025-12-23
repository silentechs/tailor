import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-permission';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        await requireAdmin();

        const [
            revenueData,
            activeTailors,
            totalOrders,
            recentActivity,
        ] = await Promise.all([
            // Total Revenue (accumulate from Order table)
            prisma.order.aggregate({
                where: {
                    status: { not: 'CANCELLED' },
                },
                _sum: {
                    totalAmount: true,
                },
            }),
            // Active Tailors
            prisma.user.count({
                where: {
                    role: 'TAILOR',
                    status: { in: ['ACTIVE', 'APPROVED'] },
                },
            }),
            // Total Orders
            prisma.order.count(),
            // Recent Activity (Mixed: New Orders and New Registrations)
            prisma.$transaction([
                prisma.order.findMany({
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        tailor: {
                            select: { name: true },
                        },
                    },
                }),
                prisma.user.findMany({
                    take: 5,
                    where: { role: 'TAILOR' },
                    orderBy: { createdAt: 'desc' },
                }),
            ]),
        ]);

        // Combine and sort recent activity
        const activityList = [
            ...recentActivity[0].map((o) => ({
                id: `order-${o.id}`,
                type: 'ORDER_CREATED',
                label: `Order ${o.orderNumber} created`,
                user: o.tailor?.name || 'Unknown Tailor',
                status: 'SUCCESS',
                time: o.createdAt,
            })),
            ...recentActivity[1].map((u) => ({
                id: `user-${u.id}`,
                type: 'TAILOR_REGISTERED',
                label: `New tailor: ${u.name}`,
                user: u.email,
                status: 'PENDING',
                time: u.createdAt,
            })),
        ].sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 10);

        return NextResponse.json({
            success: true,
            data: {
                stats: {
                    totalRevenue: revenueData._sum.totalAmount || 0,
                    activeTailors,
                    totalOrders,
                    platformHealth: 99.9, // Mocked for now
                },
                recentActivity: activityList,
            },
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        if (error instanceof Error && (error.message === 'Forbidden' || error.message === 'Unauthorized')) {
            return NextResponse.json({ success: false, error: error.message }, { status: error.message === 'Forbidden' ? 403 : 401 });
        }
        return NextResponse.json({ success: false, error: 'Failed to fetch dashboard stats' }, { status: 500 });
    }
}
