import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/direct-current-user';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        await requireAdmin();

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const page = parseInt(searchParams.get('page') || '1', 10);
        const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

        const where = {
            ...(search && {
                OR: [
                    { message: { contains: search, mode: 'insensitive' as const } },
                    { order: { orderNumber: { contains: search, mode: 'insensitive' as const } } },
                    {
                        sender: {
                            OR: [
                                { name: { contains: search, mode: 'insensitive' as const } },
                                { email: { contains: search, mode: 'insensitive' as const } }
                            ]
                        }
                    }
                ],
            }),
        };

        const [total, messages] = await Promise.all([
            prisma.orderMessage.count({ where }),
            prisma.orderMessage.findMany({
                where,
                include: {
                    order: {
                        select: {
                            orderNumber: true,
                            client: {
                                select: { name: true }
                            },
                            tailor: {
                                select: { name: true }
                            }
                        },
                    },
                    sender: {
                        select: {
                            name: true,
                            role: true,
                            profileImage: true,
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
        ]);

        return NextResponse.json({
            success: true,
            data: messages,
            pagination: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        });
    } catch (error) {
        console.error('Admin messaging error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch messages' }, { status: 500 });
    }
}
