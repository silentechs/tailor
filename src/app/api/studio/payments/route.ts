import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/direct-current-user';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const user = await requireUser();
        if (user.role !== 'CLIENT' || !user.linkedClientId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const [invoices, payments] = await Promise.all([
            prisma.invoice.findMany({
                where: { clientId: user.linkedClientId },
                orderBy: { createdAt: 'desc' },
                include: {
                    order: {
                        select: { orderNumber: true, garmentType: true }
                    }
                }
            }),
            prisma.payment.findMany({
                where: { clientId: user.linkedClientId },
                orderBy: { paidAt: 'desc' }
            })
        ]);

        return NextResponse.json({
            success: true,
            data: {
                invoices,
                payments
            }
        });

    } catch (error) {
        console.error('Studio payments error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch financial data' }, { status: 500 });
    }
}
