import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/direct-current-user';
import prisma from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';

export async function GET(request: Request) {
    try {
        await requireAdmin();

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') || undefined;
        const page = parseInt(searchParams.get('page') || '1', 10);
        const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

        const where = {
            ...(status && { status: status as OrderStatus }),
            ...(search && {
                OR: [
                    { orderNumber: { contains: search, mode: 'insensitive' as const } },
                    { garmentDescription: { contains: search, mode: 'insensitive' as const } },
                    {
                        tailor: {
                            OR: [
                                { name: { contains: search, mode: 'insensitive' as const } },
                                { businessName: { contains: search, mode: 'insensitive' as const } },
                            ]
                        }
                    },
                    {
                        client: {
                            name: { contains: search, mode: 'insensitive' as const }
                        }
                    }
                ],
            }),
        };

        const [total, orders] = await Promise.all([
            prisma.order.count({ where }),
            prisma.order.findMany({
                where,
                include: {
                    tailor: {
                        select: {
                            name: true,
                            businessName: true,
                        },
                    },
                    client: {
                        select: {
                            name: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
        ]);

        return NextResponse.json({
            success: true,
            data: orders,
            pagination: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        });
    } catch (error) {
        console.error('Admin orders error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch orders' }, { status: 500 });
    }
}
