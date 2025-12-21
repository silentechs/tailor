import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/direct-current-user';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const user = await requireUser();
        if (user.role !== 'CLIENT') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch Global User for Master Profile (using scalar selection to be safe)
        const globalUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { measurements: true, updatedAt: true } as any
        }) as any;

        // Query Clients directly to find linked profiles
        // This avoids the 'include: clientProfiles' on User which might be cached/stale
        // Cast 'where' and 'include' to any to bypass stale Client types
        const linkedProfiles = await prisma.client.findMany({
            where: { userId: user.id } as any,
            include: {
                clientMeasurements: {
                    orderBy: { createdAt: 'desc' },
                    take: 5
                },
                organization: {
                    select: { name: true }
                }
            } as any
        }) as any;

        // Aggregate history from all tailors
        const allHistory = (linkedProfiles || []).flatMap((p: any) =>
            (p.clientMeasurements || []).map((m: any) => ({
                ...m,
                source: p.organization?.name || 'Unknown Tailor'
            }))
        ).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return NextResponse.json({
            success: true,
            data: {
                // Master profile values (User.measurements) take precedence
                latest: {
                    values: (globalUser?.measurements as any) || {},
                    createdAt: globalUser?.updatedAt || new Date(),
                    notes: 'Your Global Profile',
                },
                history: allHistory,
            }
        });

    } catch (error) {
        console.error('Studio measurements error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch measurements' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const user = await requireUser();
        if (user.role !== 'CLIENT') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { values } = body;

        if (!values) {
            return NextResponse.json({ success: false, error: 'Values required' }, { status: 400 });
        }

        // 1. Update Master Profile
        // Cast data to any to bypass stale types if needed
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                measurements: values,
                // ensure isPublicProfile is true if they are saving? Maybe logic for later.
            } as any
        }) as any;

        // 2. Sync to all linked Tailors
        // Query linked profiles directly to avoid stale User model include
        const linkedProfiles = await prisma.client.findMany({
            where: { userId: user.id } as any,
            select: { id: true }
        });

        if (linkedProfiles.length > 0) {
            await prisma.$transaction(
                linkedProfiles.map((profile: any) =>
                    (prisma.clientMeasurement.create as any)({
                        data: {
                            clientId: profile.id,
                            values: values,
                            notes: 'Synced from Global Studio Profile',
                            isSynced: true
                        }
                    })
                )
            );
        }

        return NextResponse.json({ success: true, data: updatedUser.measurements });

    } catch (error) {
        console.error('Studio measurements update error:', error);
        return NextResponse.json({ success: false, error: 'Failed to update measurements' }, { status: 500 });
    }
}
