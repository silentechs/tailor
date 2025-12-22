'use client';

import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, Loader2, Scissors, User } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { DraggableWorkshopCard } from '@/components/workshop/draggable-workshop-card';
import { WorkshopColumn } from '@/components/workshop/workshop-column';
import { fetchApi } from '@/lib/fetch-api';

async function getWorkshopQueue() {
  const res = await fetchApi('/api/workshop');
  if (!res.ok) throw new Error('Failed to fetch workshop queue');
  const data = await res.json();
  return data.data;
}

export default function WorkshopPage() {
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);

  const {
    data: orders,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['workshop-queue'],
    queryFn: getWorkshopQueue,
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetchApi(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshop-queue'] });
      toast.success('Order status updated');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update');
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-12 text-destructive">Error loading workshop queue.</div>;
  }

  // Group orders by status for better visibility
  const groupedOrders = {
    CONFIRMED: orders?.filter((o: any) => o.status === 'CONFIRMED') || [],
    IN_PROGRESS: orders?.filter((o: any) => o.status === 'IN_PROGRESS') || [],
    FITTING:
      orders?.filter((o: any) => ['READY_FOR_FITTING', 'FITTING_DONE'].includes(o.status)) || [],
  };

  function handleDragStart(event: any) {
    setActiveId(event.active.id);
  }

  function handleDragEnd(event: any) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Find the order that was dragged
    const activeOrder = orders.find((o: any) => o.id === activeId);
    if (!activeOrder) return;

    // Determine target status based on the column ID
    let targetStatus = activeOrder.status;
    if (overId === 'CONFIRMED') targetStatus = 'CONFIRMED';
    else if (overId === 'IN_PROGRESS') targetStatus = 'IN_PROGRESS';
    else if (overId === 'FITTING') targetStatus = 'READY_FOR_FITTING';

    // If status changed, update it
    if (targetStatus !== activeOrder.status) {
      statusMutation.mutate({ id: activeId, status: targetStatus });
    }
  }

  const activeOrder = activeId ? orders.find((o: any) => o.id === activeId) : null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold font-heading text-primary">Workshop Queue</h1>
          <p className="text-muted-foreground mt-2">
            Drag and drop to manage Bench work and Fittings.
          </p>
        </div>
        <div className="flex gap-3">
          <Badge
            variant="outline"
            className="px-4 py-2 text-sm bg-background shadow-sm border-primary/20"
          >
            {orders?.length || 0} Active Orders
          </Badge>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
          <WorkshopColumn
            id="CONFIRMED"
            title="To Start"
            icon={<Scissors className="h-5 w-5 text-blue-500" />}
            orders={groupedOrders.CONFIRMED}
            statusMutation={statusMutation}
            emptyText="No pending starts."
          />

          <WorkshopColumn
            id="IN_PROGRESS"
            title="On the Bench"
            icon={<Clock className="h-5 w-5 text-purple-500" />}
            orders={groupedOrders.IN_PROGRESS}
            statusMutation={statusMutation}
            emptyText="Bench is empty."
          />

          <WorkshopColumn
            id="FITTING"
            title="Fittings"
            icon={<User className="h-5 w-5 text-orange-500" />}
            orders={groupedOrders.FITTING}
            statusMutation={statusMutation}
            emptyText="No fittings scheduled."
          />
        </div>

        <DragOverlay>
          {activeId && activeOrder ? (
            <div className="opacity-80 scale-105 pointer-events-none rotate-2">
              <DraggableWorkshopCard order={activeOrder} statusMutation={{ isPending: false }} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
