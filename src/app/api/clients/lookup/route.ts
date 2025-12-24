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

        const rawPhone = result.data.phone.replace(/[\s-]/g, '');
        const internationalPhone = formatGhanaPhone(rawPhone); // +233...

        // Build local format from international (e.g., +233240000003 → 0240000003)
        const localPhone = internationalPhone.startsWith('+233')
            ? '0' + internationalPhone.slice(4)
            : rawPhone;

        // Search for BOTH formats since storage may vary
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { phone: internationalPhone },
                    { phone: localPhone },
                    { phone: rawPhone },
                ],
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
