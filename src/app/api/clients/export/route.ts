import { NextResponse } from 'next/server';
import { requireActiveTailor } from '@/lib/direct-current-user';
import { generateCSV, generateExcelXML } from '@/lib/export-utils';
import prisma from '@/lib/prisma';

// GET /api/clients/export - Export clients as CSV or Excel
export async function GET(request: Request) {
    try {
        const user = await requireActiveTailor();
        const { searchParams } = new URL(request.url);
        const format = searchParams.get('format') || 'csv';

        const clients = await prisma.client.findMany({
            where: { tailorId: user.id },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: {
                        orders: true,
                        payments: true,
                    },
                },
            },
        });

        // Build data
        const headers = [
            'Name',
            'Phone',
            'Email',
            'Region',
            'City',
            'Address',
            'Total Orders',
            'Created Date',
        ];

        const rows = clients.map((client) => [
            client.name,
            client.phone,
            client.email || '',
            client.region?.replace(/_/g, ' ') || '',
            client.city || '',
            client.address || '',
            client._count.orders,
            new Date(client.createdAt).toLocaleDateString('en-GB'),
        ]);

        const date = new Date().toISOString().split('T')[0];

        if (format === 'xlsx') {
            const xml = generateExcelXML(headers, rows, 'Clients');
            return new NextResponse(xml, {
                status: 200,
                headers: {
                    'Content-Type': 'application/vnd.ms-excel',
                    'Content-Disposition': `attachment; filename="clients-${date}.xls"`,
                },
            });
        }

        // Default to CSV
        const csv = generateCSV(headers, rows);
        return new NextResponse(csv, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv;charset=utf-8;',
                'Content-Disposition': `attachment; filename="clients-${date}.csv"`,
            },
        });
    } catch (error) {
        console.error('Export clients error:', error);

        if (error instanceof Error && error.message === 'Unauthorized') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        return NextResponse.json(
            { success: false, error: 'Failed to export clients' },
            { status: 500 }
        );
    }
}
