'use client';

import { isToday } from 'date-fns';
import { Calendar, ChevronRight, Scissors } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { APPOINTMENT_STATUS_COLORS, APPOINTMENT_TYPE_LABELS, cn, formatTime } from '@/lib/utils';

interface DashboardAppointmentsProps {
  appointments: any[];
}

export function DashboardAppointments({ appointments }: DashboardAppointmentsProps) {
  const todayAppointments = appointments?.filter((a) => isToday(new Date(a.startTime))) || [];

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-0.5">
          <CardTitle className="text-lg">Today's Schedule</CardTitle>
          <CardDescription>Appointments for measurement & fittings</CardDescription>
        </div>
        <Link href="/dashboard/appointments">
          <Badge variant="outline" className="cursor-pointer hover:bg-secondary transition-colors">
            View All <ChevronRight className="h-3 w-3 ml-1" />
          </Badge>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {todayAppointments.length > 0 ? (
            todayAppointments.map((apt) => (
              <div
                key={apt.id}
                className="flex items-start gap-4 p-3 rounded-lg border bg-card hover:bg-slate-50 transition-colors"
              >
                <div className="h-10 w-10 rounded-full bg-primary/5 flex flex-col items-center justify-center border border-primary/10">
                  <span className="text-[10px] uppercase font-bold text-primary">
                    {formatTime(apt.startTime).split(' ')[1]}
                  </span>
                  <span className="text-xs font-black text-primary leading-none">
                    {formatTime(apt.startTime).split(' ')[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-bold truncate">{apt.client.name}</h4>
                    <Badge
                      className={cn(
                        'text-[9px] uppercase px-1.5 h-4',
                        APPOINTMENT_STATUS_COLORS[apt.status] || 'bg-gray-100'
                      )}
                    >
                      {apt.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {APPOINTMENT_TYPE_LABELS[apt.type] || apt.type}
                    </span>
                    {apt.orderNumber && (
                      <span className="flex items-center gap-1 truncate">
                        <Scissors className="h-3 w-3" />
                        Order #{apt.orderNumber}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center opacity-60">
              <Calendar className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm">No appointments today</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
