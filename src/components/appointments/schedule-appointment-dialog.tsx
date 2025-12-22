'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { toast } from 'sonner';
import { z } from 'zod';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const appointmentSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  orderId: z.string().optional().nullable(),
  type: z.enum(['CONSULTATION', 'MEASUREMENT', 'FITTING', 'COLLECTION', 'REPAIR']),
  date: z.string().optional(),
  time: z.string().optional(),
  duration: z.string().optional(),
  notes: z.string().optional(),
  location: z.string().optional(),
});

interface ScheduleAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: any;
}


export function ScheduleAppointmentDialog({ open, onOpenChange, initialData }: ScheduleAppointmentDialogProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const isEditing = !!initialData;


  const { data: clients, isLoading: isLoadingClients } = useQuery({
    queryKey: ['clients', searchTerm],
    queryFn: async () => {
      const res = await fetch(`/api/clients?search=${searchTerm}`);
      if (!res.ok) throw new Error('Failed to fetch clients');
      const data = await res.json();
      return data.data;
    },
    enabled: open,
  });

  const form = useForm<z.infer<typeof appointmentSchema>>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      clientId: '',
      type: 'FITTING',
      date: new Date().toISOString().split('T')[0],
      time: '10:00',
      duration: '30',
      notes: '',
      location: '',
    },
  });

  // Handle initial data for editing
  useEffect(() => {

    if (initialData && open) {
      const startTime = new Date(initialData.startTime);
      const endTime = new Date(initialData.endTime);
      const durationMins = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

      form.reset({
        clientId: initialData.clientId,
        orderId: initialData.orderId,
        type: initialData.type,
        date: startTime.toISOString().split('T')[0],
        time: startTime.toTimeString().split(' ')[0].substring(0, 5),
        duration: durationMins.toString(),
        notes: initialData.notes || '',
        location: initialData.location || '',
      });
    } else if (!open) {
      form.reset();
    }
  }, [initialData, open, form]);


  const watchedClientId = form.watch('clientId');
  const selectedClient = clients?.find((c: any) => c.id === watchedClientId);

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      const url = isEditing ? `/api/appointments/${initialData.id}` : '/api/appointments';
      const method = isEditing ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(isEditing ? 'Failed to update appointment' : 'Failed to schedule appointment');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success(isEditing ? 'Appointment rescheduled' : 'Appointment scheduled');
      onOpenChange(false);
      form.reset();
    },

    onError: (error: any) => {
      toast.error(error.message || 'Failed to schedule');
    },
  });

  const onSubmit = (values: z.infer<typeof appointmentSchema>) => {
    const startStr = `${values.date}T${values.time}:00`;
    const startTime = new Date(startStr);
    const endTime = new Date(startTime.getTime() + parseInt(values.duration || '30', 10) * 60000);

    const payload = {
      clientId: values.clientId,
      type: values.type,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      notes: values.notes,
      location: values.location,
    };
    mutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Reschedule Appointment' : 'Schedule Appointment'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the time or details for this session.' : 'Book a session with a client for measurements or fittings.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            {/* Client Selection */}
            <FormField
              control={form.control}
              name="clientId"
              render={() => (
                <FormItem className="space-y-2">
                  <FormLabel>Client</FormLabel>
                  {watchedClientId ? (
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-primary/5 border-primary/20">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {selectedClient?.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-bold">{selectedClient?.name}</p>
                          <p className="text-xs text-muted-foreground">{selectedClient?.phone}</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => form.setValue('clientId', '')}
                      >
                        Change
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search client..."
                          className="pl-9"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto border rounded-md p-1">
                        {clients?.map((client: any) => (
                          <div
                            key={client.id}
                            className="flex items-center gap-3 p-2 hover:bg-muted rounded cursor-pointer transition-colors"
                            onClick={() => form.setValue('clientId', client.id)}
                          >
                            <Avatar className="h-6 w-6">
                              <AvatarFallback>{client.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{client.name}</span>
                            <span className="text-xs text-muted-foreground ml-auto">
                              {client.phone}
                            </span>
                          </div>
                        ))}
                        {clients?.length === 0 && (
                          <p className="text-xs text-center py-4 text-muted-foreground">
                            No clients found.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CONSULTATION">Consultation</SelectItem>
                        <SelectItem value="MEASUREMENT">Measurement</SelectItem>
                        <SelectItem value="FITTING">Fitting</SelectItem>
                        <SelectItem value="COLLECTION">Collection</SelectItem>
                        <SelectItem value="REPAIR">Repair</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (Mins)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="15">15 mins</SelectItem>
                        <SelectItem value="30">30 mins</SelectItem>
                        <SelectItem value="45">45 mins</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location / Landmark (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Workshop, Client's Office, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Special Notes</FormLabel>
                  <FormControl>
                    <Input placeholder="Bring fabric samples, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Save Changes' : 'Schedule'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
