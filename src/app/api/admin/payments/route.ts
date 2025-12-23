import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-permission';
import prisma from '@/lib/prisma';
import { PaymentStatus } from '@prisma/client';

export async function GET(request: Request) {
    try {
        await requireAdmin();

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') || undefined;
        const page = parseInt(searchParams.get('page') || '1', 10);
        const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

        const where = {
            ...(status && { status: status as PaymentStatus }),
            ...(search && {
                OR: [
                    { transactionId: { contains: search, mode: 'insensitive' as const } },
                    { order: { orderNumber: { contains: search, mode: 'insensitive' as const } } },
                    {
                        order: {
                            tailor: {
                                OR: [
                                    { name: { contains: search, mode: 'insensitive' as const } },
                                    { businessName: { contains: search, mode: 'insensitive' as const } },
                                ]
                            }
                        }
                    }
                ],
            }),
        };

        const [total, payments] = await Promise.all([
            prisma.payment.count({ where }),
            prisma.payment.findMany({
                where,
                include: {
                    order: {
                        select: {
                            orderNumber: true,
                            tailor: {
                                select: {
                                    name: true,
                                    businessName: true,
                                },
                            },
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
            data: payments,
            pagination: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        });
    } catch (error) {
        console.error('Admin payments error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch payments' }, { status: 500 });
    }
}
