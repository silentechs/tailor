'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, ChevronRight, GripVertical, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn, formatDate } from '@/lib/utils';

interface DraggableWorkshopCardProps {
  order: any;
  statusMutation: any;
}

export function DraggableWorkshopCard({ order, statusMutation }: DraggableWorkshopCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: order.id,
    data: {
      type: 'Order',
      order,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 1,
  };

  const isUrgent = order.deadline && new Date(order.deadline).getTime() - Date.now() < 172800000; // 48 hours

  const statusColors: Record<string, string> = {
    CONFIRMED: 'border-l-red-500',
    IN_PROGRESS: 'border-l-amber-500',
    READY_FOR_FITTING: 'border-l-emerald-500',
    FITTING_DONE: 'border-l-emerald-600',
  };

  return (
    <div ref={setNodeRef} style={style} className="">
      <Card
        className={cn(
          'group relative overflow-hidden transition-all hover:shadow-lg border-2 border-l-4',
          statusColors[order.status] || 'border-l-primary',
          isUrgent ? 'border-destructive/30 bg-destructive/5' : 'hover:border-primary/20',
          isDragging && 'ring-2 ring-primary ring-offset-2'
        )}
      >
        <CardHeader className="pb-2 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded touch-none"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="text-xs font-mono font-bold text-muted-foreground">
                {order.orderNumber}
              </span>
            </div>
            {isUrgent && (
              <Badge variant="destructive" className="animate-pulse text-[10px] px-1.5 h-4">
                URGENT
              </Badge>
            )}
          </div>
          <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
            {order.garmentType?.replace(/_/g, ' ')}
          </CardTitle>
          <p className="text-sm font-medium text-muted-foreground">{order.client?.name}</p>
        </CardHeader>
        <CardContent className="space-y-3 pb-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>Due: {order.deadline ? formatDate(order.deadline) : 'No deadline'}</span>
          </div>

          {order.measurement?.values && (
            <div className="bg-muted/30 p-2 rounded text-[10px] grid grid-cols-2 gap-x-4 gap-y-1">
              {Object.entries(order.measurement.values)
                .slice(0, 4)
                .map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-muted py-0.5">
                    <span className="uppercase opacity-70 tracking-tighter">{k}</span>
                    <span className="font-bold">{String(v)}"</span>
                  </div>
                ))}
            </div>
          )}
          {order.tasks && order.tasks.length > 0 && (
            <div className="space-y-1 mt-3">
              <div className="flex justify-between text-[10px] font-medium">
                <span>Task Progress</span>
                <span>
                  {order.tasks.filter((t: any) => t.status === 'COMPLETED').length}/
                  {order.tasks.length}
                </span>
              </div>
              <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{
                    width: `${(order.tasks.filter((t: any) => t.status === 'COMPLETED').length / order.tasks.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="pt-0 flex gap-2">
          {order.status === 'CONFIRMED' && (
            <Button
              size="sm"
              variant="default"
              className="text-xs w-full bg-blue-600 hover:bg-blue-700 h-10"
              onClick={() => statusMutation.mutate({ id: order.id, status: 'IN_PROGRESS' })}
              disabled={statusMutation.isPending}
            >
              {statusMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                'Start Work'
              )}
            </Button>
          )}
          {order.status === 'IN_PROGRESS' && (
            <Button
              size="sm"
              variant="default"
              className="text-xs w-full bg-orange-600 hover:bg-orange-700 h-10"
              onClick={() => statusMutation.mutate({ id: order.id, status: 'READY_FOR_FITTING' })}
              disabled={statusMutation.isPending}
            >
              {statusMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                'Mark Ready'
              )}
            </Button>
          )}
          {order.status === 'READY_FOR_FITTING' && (
            <Button
              size="sm"
              variant="default"
              className="text-xs w-full bg-emerald-600 hover:bg-emerald-700 h-10"
              onClick={() => statusMutation.mutate({ id: order.id, status: 'FITTING_DONE' })}
              disabled={statusMutation.isPending}
            >
              {statusMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                'Fitting Done'
              )}
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="text-xs px-2 h-10"
            asChild
            title="View Order"
          >
            <Link href={`/dashboard/orders/${order.id}`}>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
