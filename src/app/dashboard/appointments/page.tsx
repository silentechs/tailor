'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { endOfDay, isToday, startOfToday } from 'date-fns';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  MoreHorizontal,
  Plus,
  Scissors,
  User,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ScheduleAppointmentDialog } from '@/components/appointments/schedule-appointment-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  APPOINTMENT_STATUS_COLORS,
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_TYPE_LABELS,
  cn,
  formatDate,
  formatTime,
} from '@/lib/utils';

async function getAppointments() {
  const res = await fetch('/api/appointments');
  if (!res.ok) throw new Error('Failed to fetch appointments');
  const data = await res.json();
  return data.data;
}

export default function AppointmentsPage() {
  const queryClient = useQueryClient();
  const [_selectedDate, _setSelectedDate] = useState(new Date());
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  const {
    data: appointments,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['appointments'],
    queryFn: getAppointments,
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Update failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Appointment updated');
    },
  });

  const _activeAppointments =
    appointments?.filter(
      (a: any) =>
        (a.status === 'SCHEDULED' || a.status === 'CONFIRMED') &&
        new Date(a.startTime) >= startOfToday()
    ) || [];

  const historyAppointments =
    appointments?.filter(
      (a: any) =>
        a.status === 'COMPLETED' ||
        a.status === 'CANCELLED' ||
        a.status === 'NO_SHOW' ||
        new Date(a.startTime) < startOfToday()
    ) || [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold font-heading text-primary">Appointment Hub</h1>
          <p className="text-muted-foreground mt-2">
            Manage measurements, fittings, and collections.
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setIsScheduleOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Appointment
          </Button>
        </div>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">Upcoming</TabsTrigger>
          <TabsTrigger value="history">Past & Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Today's Schedule */}
            <div className="lg:col-span-1 space-y-4">
              <h2 className="font-heading font-bold text-lg flex items-center gap-2 px-2">
                <Clock className="h-5 w-5 text-orange-500" />
                Today
              </h2>
              <div className="space-y-4">
                {appointments
                  ?.filter(
                    (a: any) =>
                      isToday(new Date(a.startTime)) &&
                      (a.status === 'SCHEDULED' || a.status === 'CONFIRMED')
                  )
                  .map((apt: any) => (
                    <AppointmentCard
                      key={apt.id}
                      appointment={apt}
                      onStatusChange={(status) => statusMutation.mutate({ id: apt.id, status })}
                    />
                  ))}
                {appointments?.filter(
                  (a: any) =>
                    isToday(new Date(a.startTime)) &&
                    (a.status === 'SCHEDULED' || a.status === 'CONFIRMED')
                ).length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/5">
                    <p className="text-sm text-muted-foreground">No active appointments today.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="font-heading font-bold text-lg flex items-center gap-2 px-2">
                <CalendarIcon className="h-5 w-5 text-blue-500" />
                Upcoming
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {appointments
                  ?.filter(
                    (a: any) =>
                      new Date(a.startTime) > endOfDay(new Date()) &&
                      (a.status === 'SCHEDULED' || a.status === 'CONFIRMED')
                  )
                  .map((apt: any) => (
                    <AppointmentCard
                      key={apt.id}
                      appointment={apt}
                      onStatusChange={(status) => statusMutation.mutate({ id: apt.id, status })}
                    />
                  ))}
                {appointments?.filter(
                  (a: any) =>
                    new Date(a.startTime) > endOfDay(new Date()) &&
                    (a.status === 'SCHEDULED' || a.status === 'CONFIRMED')
                ).length === 0 && (
                  <div className="col-span-full text-center py-12 border-2 border-dashed rounded-xl bg-muted/5">
                    <p className="text-sm text-muted-foreground">No other upcoming bookings.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {historyAppointments
              .sort(
                (a: any, b: any) =>
                  new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
              )
              .map((apt: any) => (
                <AppointmentCard
                  key={apt.id}
                  appointment={apt}
                  onStatusChange={(status) => statusMutation.mutate({ id: apt.id, status })}
                />
              ))}
          </div>
        </TabsContent>
      </Tabs>

      <ScheduleAppointmentDialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen} />
    </div>
  );
}

function AppointmentCard({
  appointment,
  onStatusChange,
}: {
  appointment: any;
  onStatusChange: (status: string) => void;
}) {
  const typeLabel = APPOINTMENT_TYPE_LABELS[appointment.type] || appointment.type;
  const statusLabel = APPOINTMENT_STATUS_LABELS[appointment.status] || appointment.status;
  const statusColor = APPOINTMENT_STATUS_COLORS[appointment.status] || 'bg-gray-100';

  return (
    <Card className="group hover:shadow-md transition-all border-l-4 border-l-primary relative overflow-hidden">
      <div className="absolute top-0 right-0 p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onStatusChange('CONFIRMED')}>
              <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
              Confirm
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusChange('COMPLETED')}>
              <CheckCircle2 className="mr-2 h-4 w-4 text-blue-500" />
              Mark Completed
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusChange('CANCELLED')}>
              <XCircle className="mr-2 h-4 w-4 text-red-500" />
              Cancel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
            {typeLabel}
          </Badge>
          <Badge className={cn('text-[10px] uppercase', statusColor)}>{statusLabel}</Badge>
        </div>
        <CardTitle className="text-base flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          {appointment.client.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center gap-4 text-muted-foreground font-medium">
          <div className="flex items-center gap-1">
            <CalendarIcon className="h-3.5 w-3.5 text-primary" />
            {isToday(new Date(appointment.startTime)) ? 'Today' : formatDate(appointment.startTime)}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-primary" />
            {formatTime(appointment.startTime)}
          </div>
        </div>

        {appointment.order && (
          <div className="flex items-center gap-2 text-xs bg-muted/50 p-2 rounded border border-muted">
            <Scissors className="h-3 w-3 text-primary" />
            <span className="font-semibold">Order: {appointment.order.orderNumber}</span>
            <span className="text-muted-foreground">
              ({appointment.order.garmentType.replace(/_/g, ' ')})
            </span>
          </div>
        )}

        {appointment.location && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {appointment.location}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
