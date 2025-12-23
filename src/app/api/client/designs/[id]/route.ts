import { NextResponse } from 'next/server';
import { requireClient } from '@/lib/direct-current-user';
import prisma from '@/lib/prisma';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/client/designs/[id] - Get a specific design
export async function GET(_request: Request, { params }: RouteParams) {
    try {
        const user = await requireClient();
        const { id } = await params;

        // Fetch user's linked client profiles
        const userWithClients = await prisma.user.findUnique({
            where: { id: user.id },
            include: { clientProfiles: { select: { id: true } } },
        });

        const clientIds = userWithClients?.clientProfiles.map((c) => c.id) || [];

        const design = await prisma.clientDesign.findFirst({
            where: {
                id,
                OR: [{ userId: user.id }, { clientId: { in: clientIds } }],
            },
        });

        if (!design) {
            return NextResponse.json({ success: false, error: 'Design not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: design });
    } catch (error) {
        console.error('Get design error:', error);
        if (error instanceof Error && error.message === 'Forbidden') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ success: false, error: 'Failed to fetch design' }, { status: 500 });
    }
}

// DELETE /api/client/designs/[id] - Delete a design
export async function DELETE(_request: Request, { params }: RouteParams) {
    try {
        const user = await requireClient();
        const { id } = await params;

        // Fetch user's linked client profiles
        const userWithClients = await prisma.user.findUnique({
            where: { id: user.id },
            include: { clientProfiles: { select: { id: true } } },
        });

        const clientIds = userWithClients?.clientProfiles.map((c) => c.id) || [];

        // Verify ownership - user can only delete their own designs or designs linked to their client profiles
        const design = await prisma.clientDesign.findFirst({
            where: {
                id,
                OR: [{ userId: user.id }, { clientId: { in: clientIds } }],
            },
        });

        if (!design) {
            return NextResponse.json({ success: false, error: 'Design not found' }, { status: 404 });
        }

        // Delete the design
        await prisma.clientDesign.delete({
            where: { id },
        });

        // Note: In production, you may also want to delete the actual image files from storage
        // This would require integration with your file storage service (e.g., Cloudflare R2)

        return NextResponse.json({ success: true, message: 'Design deleted successfully' });
    } catch (error) {
        console.error('Delete design error:', error);
        if (error instanceof Error && error.message === 'Forbidden') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ success: false, error: 'Failed to delete design' }, { status: 500 });
    }
}
