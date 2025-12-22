import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireOrganization, requirePermission } from '@/lib/require-permission';

export async function GET() {
  try {
    const { organizationId } = await requireOrganization();
    await requirePermission('inventory:read', organizationId);

    // Get the organization owner's ID to fetch their equipment
    // (In the future, we should add organizationId to the Equipment model)
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { ownerId: true },
    });

    if (!org) {
      throw new Error('Organization not found');
    }

    const equipment = await prisma.equipment.findMany({
      where: { tailorId: org.ownerId },
      include: {
        maintenance: {
          orderBy: { completedDate: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: equipment,
    });
  } catch (error) {
    console.error('Get equipment error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch equipment',
      },
      { status: error instanceof Error && error.message.includes('Forbidden') ? 403 : 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { user, organizationId } = await requireOrganization();
    await requirePermission('inventory:write', organizationId);

    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { ownerId: true },
    });

    if (!org) {
      throw new Error('Organization not found');
    }

    const body = await request.json();

    const item = await prisma.equipment.create({
      data: {
        ...body,
        tailorId: org.ownerId, // Link to the shop owner
      },
    });

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error) {
    console.error('Create equipment error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create equipment',
      },
      { status: error instanceof Error && error.message.includes('Forbidden') ? 403 : 500 }
    );
  }
}
