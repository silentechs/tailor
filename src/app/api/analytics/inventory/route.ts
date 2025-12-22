import { NextResponse } from 'next/server';
import { requireOrganization } from '@/lib/require-permission';
import prisma from '@/lib/prisma';

// GET /api/analytics/inventory - Get top used items and movement stats
export async function GET() {
    try {
        const { organizationId } = await requireOrganization();

        // 1. Top consumed items (ISSUE type movements)
        const topUsed = await prisma.inventoryMovement.groupBy({
            by: ['itemId'],
            where: {
                type: 'ISSUE',
                // In a real app we'd filter by date range
            },
            _sum: {
                quantity: true
            },
            orderBy: {
                _sum: {
                    quantity: 'desc'
                }
            },
            take: 5
        });

        // Resolve item names
        const enrichedTopUsed = await Promise.all(
            topUsed.map(async (stat) => {
                const item = await prisma.inventoryItem.findUnique({
                    where: { id: stat.itemId },
                    select: { name: true, unitOfMeasure: true }
                });
                return {
                    name: item?.name || 'Unknown',
                    total: stat._sum.quantity,
                    unit: item?.unitOfMeasure
                };
            })
        );

        // 2. Movement frequency by type
        const movementStats = await prisma.inventoryMovement.groupBy({
            by: ['type'],
            _count: true
        });

        return NextResponse.json({
            success: true,
            data: {
                topUsed: enrichedTopUsed,
                movementStats
            }
        });
    } catch (error) {
        console.error('Inventory analytics error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed' },
            { status: 500 }
        );
    }
}
