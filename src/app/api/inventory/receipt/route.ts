import { NextResponse } from 'next/server';
import { requireOrganization, requirePermission } from '@/lib/require-permission';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const receiptSchema = z.object({
    items: z.array(z.object({
        itemId: z.string().min(1),
        quantity: z.number().positive(),
        unitPrice: z.number().nonnegative().optional(),
        supplier: z.string().optional(),
    })).min(1),
});

// POST /api/inventory/receipt - Bulk receive inventory stock
export async function POST(request: Request) {
    try {
        const { user, organizationId } = await requireOrganization();
        await requirePermission('inventory:write', organizationId);

        const body = await request.json();
        const { items } = receiptSchema.parse(body);

        const result = await prisma.$transaction(async (tx) => {
            const movements = [];
            const updates = [];

            for (const item of items) {
                // 1. Create movement
                movements.push(
                    tx.inventoryMovement.create({
                        data: {
                            tailorId: user.id,
                            itemId: item.itemId,
                            type: 'RECEIPT',
                            quantity: item.quantity,
                            reason: `Stock Receipt${item.supplier ? ` from ${item.supplier}` : ''}`,
                        },
                    })
                );

                // 2. Update stock level
                updates.push(
                    tx.inventoryItem.update({
                        where: { id: item.itemId },
                        data: {
                            quantity: { increment: item.quantity },
                            unitCost: item.unitPrice ?? undefined,
                        },
                    })
                );
            }

            await Promise.all([...movements, ...updates]);
            return { count: items.length };
        });

        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        console.error('Inventory receipt error:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 });
        }
        return NextResponse.json({ success: false, error: 'Failed to process receipt' }, { status: 500 });
    }
}
