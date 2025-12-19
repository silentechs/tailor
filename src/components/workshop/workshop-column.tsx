'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DraggableWorkshopCard } from './draggable-workshop-card';

interface WorkshopColumnProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  orders: any[];
  statusMutation: any;
  emptyText: string;
}

export function WorkshopColumn({
  id,
  title,
  icon,
  orders,
  statusMutation,
  emptyText,
}: WorkshopColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div className="space-y-4 flex flex-col h-full">
      <div className="flex items-center justify-between px-2">
        <h2 className="font-heading font-bold text-lg flex items-center gap-2">
          {icon}
          {title}
          <Badge variant="secondary" className="ml-2">
            {orders.length}
          </Badge>
        </h2>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 space-y-4 p-2 rounded-xl transition-colors min-h-[500px]',
          isOver
            ? 'bg-primary/5 border-2 border-dashed border-primary/20'
            : 'bg-transparent border-2 border-transparent'
        )}
      >
        <SortableContext items={orders.map((o) => o.id)} strategy={verticalListSortingStrategy}>
          {orders.map((order) => (
            <DraggableWorkshopCard key={order.id} order={order} statusMutation={statusMutation} />
          ))}
        </SortableContext>

        {orders.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed rounded-xl bg-muted/5">
            <p className="text-sm text-muted-foreground font-medium">{emptyText}</p>
          </div>
        )}
      </div>
    </div>
  );
}
