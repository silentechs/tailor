import type { Prisma, UserRole, UserStatus } from '@prisma/client';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-permission';
import prisma from '@/lib/prisma';

// GET /api/admin/users - List all users (admin only)
export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const status = searchParams.get('status');
    const role = searchParams.get('role');
    const search = searchParams.get('search');

    const where: Prisma.UserWhereInput = {
      ...(status && { status: status as UserStatus }),
      ...(role && { role: role as UserRole }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
          { businessName: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const total = await prisma.user.count({ where });

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        businessName: true,
        region: true,
        city: true,
        role: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            clients: true,
            orders: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: users.map((user) => {
        const { _count, ...rest } = user;
        return {
          ...rest,
          clientCount: _count.clients,
          orderCount: _count.orders,
        };
      }),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);

    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 });
  }
}
