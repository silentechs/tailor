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
        const search = searchParams.get('search') || '';
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
        const offset = parseInt(searchParams.get('offset') || '0');

        // Build where clause
        const where: any = {};

        if (search) {
            where.user = {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ],
            };
        }

        // Fetch sessions with user data
        const [sessions, total] = await Promise.all([
            prisma.session.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true,
                            profileImage: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            prisma.session.count({ where }),
        ]);

        // Format response
        const data = sessions.map(session => ({
            id: session.id,
            userId: session.userId,
            userName: session.user.name,
            userEmail: session.user.email,
            userRole: session.user.role,
            userImage: session.user.profileImage,
            ipAddress: session.ipAddress,
            userAgent: session.userAgent,
            country: session.country,
            city: session.city,
            region: session.region,
            countryCode: session.countryCode,
            createdAt: session.createdAt,
            expiresAt: session.expiresAt,
        }));

        return NextResponse.json(
            {
                success: true,
                data,
                pagination: {
                    total,
                    limit,
                    offset,
                    hasMore: offset + limit < total,
                },
            },
            { headers: SECURITY_HEADERS }
        );
    } catch (error) {
        console.error('Login history fetch error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch login history' },
            { status: 500, headers: SECURITY_HEADERS }
        );
    }
}
