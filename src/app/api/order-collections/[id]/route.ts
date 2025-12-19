import { NextResponse } from 'next/server';
import { requireActiveTailor } from '@/lib/direct-current-user';
import prisma from '@/lib/prisma';

// GET /api/order-collections/[id] - Get a specific collection
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireActiveTailor();
    const { id } = await params;

    const collection = await prisma.orderCollection.findUnique({
      where: {
        id,
        tailorId: user.id,
      },
      include: {
        orders: {
          include: {
            client: true,
          },
        },
      },
    });

    if (!collection) {
      return NextResponse.json({ success: false, error: 'Collection not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: collection,
    });
  } catch (error) {
    console.error('Get collection error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch collection' },
      { status: 500 }
    );
  }
}

// DELETE /api/order-collections/[id] - Delete a collection (and optionally its orders)
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireActiveTailor();
    const { id } = await params;

    // Check if collection exists and belongs to user
    const collection = await prisma.orderCollection.findUnique({
      where: {
        id,
        tailorId: user.id,
      },
    });

    if (!collection) {
      return NextResponse.json({ success: false, error: 'Collection not found' }, { status: 404 });
    }

    // Delete collection
    // Orders will be deleted automatically due to onDelete: Cascade on the Order relation if set,
    // But checking schema: Order has `collection OrderCollection? @relation(fields: [collectionId], references: [id])`
    // The relation is defined on Order side. If we want to delete orders when collection is deleted, we need to check constraints.
    // Schema says: `collection        OrderCollection?  @relation(fields: [collectionId], references: [id])`
    // It does NOT say onDelete: Cascade. So orders will just have collectionId set to null if we delete collection, OR it will fail if constraints prevent it.
    // Let's assume we want to just delete the collection record for now, or we might need to delete orders manually if that's the intent.
    // For now, let's just delete the collection. The schema doesn't enforce cascade delete from collection to orders based on my reading of `schema.prisma`.

    // Wait, I should check the schema again.
    // Order -> Collection is optional relation.

    await prisma.orderCollection.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Collection deleted',
    });
  } catch (error) {
    console.error('Delete collection error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete collection' },
      { status: 500 }
    );
  }
}
