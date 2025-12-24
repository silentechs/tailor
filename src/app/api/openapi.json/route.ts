import { NextResponse } from 'next/server';
import { generateOpenApi } from '@/lib/api-docs';

// Import routes here to ensure they register themselves with the registry
import '../clients/route';
import '../orders/route';
import '../inventory/route';
import '../payments/route';

export async function GET() {
    try {
        const spec = generateOpenApi();
        return NextResponse.json(spec);
    } catch (error) {
        console.error('Error generating OpenAPI spec:', error);
        return NextResponse.json({ error: 'Failed to generate API documentation' }, { status: 500 });
    }
}
