import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireOrganization, requirePermission } from '@/lib/require-permission';

// GET /api/dashboard/stats - Get dashboard statistics
export async function GET() {
  try {
    const { user, organizationId } = await requireOrganization();
    await requirePermission('payments:read', organizationId);

    // Get date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const whereBase = { organizationId };

    // Parallel queries for stats
    const [
      totalClients,
      totalOrders,
      pendingOrders,
      completedOrders,
      monthlyRevenue,
      weeklyRevenue,
      todayRevenue,
      recentOrders,
      ordersByStatus,
      paymentsByMethod,
      topGarments,
      upcomingAppointments,
    ] = await Promise.all([
      // Total clients
      prisma.client.count({
        where: whereBase,
      }),

      // Total orders
      prisma.order.count({
        where: whereBase,
      }),

      // Pending orders
      prisma.order.count({
        where: {
          ...whereBase,
          status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
        },
      }),

      // Completed orders this month
      prisma.order.count({
        where: {
          ...whereBase,
          status: 'COMPLETED',
          completedAt: { gte: startOfMonth },
        },
      }),

      // Monthly revenue
      prisma.payment.aggregate({
        where: {
          ...whereBase,
          status: 'COMPLETED',
          paidAt: { gte: startOfMonth },
        },
        _sum: { amount: true },
      }),

      // Weekly revenue
      prisma.payment.aggregate({
        where: {
          ...whereBase,
          status: 'COMPLETED',
          paidAt: { gte: startOfWeek },
        },
        _sum: { amount: true },
      }),

      // Today's revenue
      prisma.payment.aggregate({
        where: {
          ...whereBase,
          status: 'COMPLETED',
          paidAt: { gte: startOfDay },
        },
        _sum: { amount: true },
      }),

      // Recent orders
      prisma.order.findMany({
        where: whereBase,
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          client: {
            select: { name: true },
          },
        },
      }),

      // Orders by status
      prisma.order.groupBy({
        by: ['status'],
        where: whereBase,
        _count: { status: true },
      }),

      // Payments by method
      prisma.payment.groupBy({
        by: ['method'],
        where: {
          ...whereBase,
          status: 'COMPLETED',
          paidAt: { gte: startOfMonth },
        },
        _sum: { amount: true },
      }),

      // Top Garments
      prisma.order.groupBy({
        by: ['garmentType'],
        where: whereBase,
        _count: { garmentType: true },
        orderBy: { _count: { garmentType: 'desc' } },
        take: 5,
      }),

      // Upcoming Appointments
      prisma.appointment.findMany({
        where: {
          ...whereBase,
          startTime: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
        orderBy: { startTime: 'asc' },
        include: {
          client: { select: { name: true } },
          order: { select: { orderNumber: true } },
        },
      }),
    ]);

    // Revenue Trend (Last 6 months)
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push({
        start: new Date(d.getFullYear(), d.getMonth(), 1),
        end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59),
        label: d.toLocaleString('default', { month: 'short' }),
      });
    }

    const revenueTrend = await Promise.all(
      months.map(async (m) => {
        const result = await prisma.payment.aggregate({
          where: {
            ...whereBase,
            status: 'COMPLETED',
            paidAt: { gte: m.start, lte: m.end },
          },
          _sum: { amount: true },
        });
        return {
          month: m.label,
          revenue: Number(result._sum.amount || 0),
        };
      })
    );

    // Calculate average order value
    const avgOrderValue = await prisma.order.aggregate({
      where: {
        ...whereBase,
        status: 'COMPLETED',
      },
      _avg: { totalAmount: true },
    });

    // Get unread notifications count (Notifications are user-based, not org-based)
    const unreadNotifications = await prisma.notification.count({
      where: {
        userId: user.id,
        isRead: false,
      },
    });

    // Calculate growth percentages
    const prevMonthStart = new Date(startOfMonth);
    prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);
    const prevMonthEnd = new Date(startOfMonth);
    prevMonthEnd.setDate(0);

    const [prevMonthRevenue, prevMonthClients] = await Promise.all([
      prisma.payment.aggregate({
        where: {
          ...whereBase,
          status: 'COMPLETED',
          paidAt: { gte: prevMonthStart, lte: prevMonthEnd },
        },
        _sum: { amount: true },
      }),
      prisma.client.count({
        where: {
          ...whereBase,
          createdAt: { gte: prevMonthStart, lte: prevMonthEnd },
        },
      }),
    ]);

    // Additional workshop stats
    const readyForFittingOrders = await prisma.order.count({
      where: {
        ...whereBase,
        status: 'READY_FOR_FITTING',
      },
    });

    const revGrowth = prevMonthRevenue._sum.amount
      ? Math.round(
          ((Number(monthlyRevenue._sum.amount || 0) - Number(prevMonthRevenue._sum.amount)) /
            Number(prevMonthRevenue._sum.amount)) *
            100
        )
      : 100;

    const clientGrowth = prevMonthClients
      ? Math.round(((totalClients - prevMonthClients) / prevMonthClients) * 100)
      : totalClients * 100;

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalClients,
          totalOrders,
          pendingOrders,
          completedOrdersThisMonth: completedOrders,
          unreadNotifications,
          clientGrowth: clientGrowth > 0 ? `+${clientGrowth}%` : `${clientGrowth}%`,
          readyForFittingOrders,
        },
        revenue: {
          today: todayRevenue._sum.amount ? Number(todayRevenue._sum.amount) : 0,
          thisWeek: weeklyRevenue._sum.amount ? Number(weeklyRevenue._sum.amount) : 0,
          thisMonth: monthlyRevenue._sum.amount ? Number(monthlyRevenue._sum.amount) : 0,
          averageOrderValue: avgOrderValue._avg.totalAmount
            ? Number(avgOrderValue._avg.totalAmount)
            : 0,
          revenueGrowth: revGrowth > 0 ? `+${revGrowth}%` : `${revGrowth}%`,
          revenueTarget: 5000, // Dynamic target based on scale could go here
        },
        ordersByStatus: ordersByStatus.map((item) => ({
          status: item.status,
          count: item._count.status,
        })),
        paymentsByMethod: paymentsByMethod.map((item) => ({
          method: item.method,
          amount: item._sum.amount ? Number(item._sum.amount) : 0,
        })),
        recentOrders: recentOrders.map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          clientName: order.client.name,
          garmentType: order.garmentType,
          status: order.status,
          totalAmount: Number(order.totalAmount),
          createdAt: order.createdAt,
        })),
        revenueTrend,
        garmentDistribution: topGarments.map((item) => ({
          type: item.garmentType,
          count: item._count.garmentType,
        })),
        appointments: upcomingAppointments.map((appt) => ({
          id: appt.id,
          startTime: appt.startTime,
          type: appt.type,
          status: appt.status,
          client: { name: appt.client.name },
          orderNumber: appt.order?.orderNumber || null,
        })),
      },
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch dashboard stats',
      },
      { status: error instanceof Error && error.message.includes('Forbidden') ? 403 : 500 }
    );
  }
}
