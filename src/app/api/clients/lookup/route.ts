import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOrganization } from '@/lib/require-permission';
import prisma from '@/lib/prisma';
import { formatGhanaPhone, isValidGhanaPhone } from '@/lib/utils';

const lookupSchema = z.object({
    phone: z.string().refine((val) => isValidGhanaPhone(val), 'Invalid phone'),
});

// POST /api/clients/lookup - Check if a user exists with this phone
export async function POST(request: Request) {
    try {
        await requireOrganization(); // Ensure user is authenticated

        const body = await request.json();
        const result = lookupSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ found: false });
        }

        const formattedPhone = formatGhanaPhone(result.data.phone);

        // Look for an existing CLIENT user with this phone
        const existingUser = await prisma.user.findFirst({
            where: {
                phone: formattedPhone,
                role: 'CLIENT',
            },
            select: {
                id: true,
                name: true,
                email: true,
                profileImage: true,
            },
        });

        if (existingUser) {
            return NextResponse.json({
                found: true,
                user: existingUser,
                message: 'This client already has a StitchCraft account. Their profile will be linked automatically.',
            });
        }

        return NextResponse.json({ found: false });
    } catch (error) {
        console.error('Client lookup error:', error);
        return NextResponse.json({ found: false });
    }
}
