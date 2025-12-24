import { NextResponse } from 'next/server';
import { requireOrganization } from '@/lib/require-permission';
import prisma from '@/lib/prisma';
import { startOfDay, subDays, format } from 'date-fns';

export async function GET() {
    try {
        const { organizationId } = await requireOrganization();

        const today = startOfDay(new Date());
        const thirtyDaysAgo = subDays(today, 30);

        // 1. Revenue Trend (Last 30 days)
        const payments = await prisma.payment.findMany({
            where: {
                organizationId,
                status: 'COMPLETED',
                paidAt: { gte: thirtyDaysAgo },
            },
            select: {
                amount: true,
                paidAt: true,
            },
            orderBy: { paidAt: 'asc' },
        });

        const revenueTrend = Array.from({ length: 30 }).map((_, i) => {
            const date = subDays(today, 29 - i);
            const dateStr = format(date, 'yyyy-MM-dd');
            const dailyTotal = payments
                .filter((p) => format(new Date(p.paidAt!), 'yyyy-MM-dd') === dateStr)
                .reduce((sum, p) => sum + Number(p.amount), 0);

            return {
                date: format(date, 'MMM dd'),
                amount: dailyTotal,
            };
        });

        // 2. Garment Type Distribution
        const orders = await prisma.order.findMany({
            where: { organizationId },
            select: { garmentType: true },
        });

        const garmentDist = orders.reduce((acc, order) => {
            const type = order.garmentType.replace(/_/g, ' ');
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const garmentData = Object.entries(garmentDist).map(([name, value]) => ({
            name,
            value,
        }));

        // 3. Top Clients
        const topClients = await prisma.client.findMany({
            where: { organizationId },
            select: {
                id: true,
                name: true,
                _count: { select: { orders: true } },
                payments: {
                    where: { status: 'COMPLETED' },
                    select: { amount: true },
                },
            },
        });

        const formattedTopClients = topClients
            .map((c) => ({
                id: c.id,
                name: c.name,
                orderCount: c._count.orders,
                totalRevenue: c.payments.reduce((sum, p) => sum + Number(p.amount), 0),
            }))
            .sort((a, b) => b.totalRevenue - a.totalRevenue)
            .slice(0, 5);

        // 4. Payment Method Distribution
        const methodDist = await prisma.payment.groupBy({
            by: ['method'],
            where: { organizationId, status: 'COMPLETED' },
            _count: { _all: true },
            _sum: { amount: true },
        });

        const methodData = methodDist.map((m) => ({
            name: m.method,
            value: Number(m._sum.amount || 0),
            count: m._count._all,
        }));

        // 5. Recent Leads (Clients with isLead=true)
        const leads = await prisma.client.findMany({
            where: { organizationId, isLead: true },
            include: {
                _count: { select: { appointments: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 6,
        });

        // 6. Inventory Usage
        const topUsed = await prisma.inventoryMovement.groupBy({
            by: ['itemId'],
            where: {
                type: 'ISSUE',
                item: { is: { organizationId } },
            },
            _sum: { quantity: true },
            orderBy: { _sum: { quantity: 'desc' } },
            take: 5,
        });

        const inventoryUsage = await Promise.all(
            topUsed.map(async (stat) => {
                const item = await prisma.inventoryItem.findUnique({
                    where: { id: stat.itemId },
                    select: { name: true, unitOfMeasure: true },
                });
                return {
                    name: item?.name || 'Unknown',
                    total: Number(stat._sum.quantity || 0),
                    unit: item?.unitOfMeasure,
                };
            })
        );

        return NextResponse.json({
            success: true,
            data: {
                revenueTrend,
                garmentData,
                topClients: formattedTopClients,
                methodData,
                leads,
                inventoryUsage,
            },
        });
    } catch (error) {
        console.error('Analytics API Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch analytics' },
            { status: 500 }
        );
    }
}
