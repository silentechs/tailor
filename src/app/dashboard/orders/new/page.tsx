'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  CalendarIcon,
  Check,
  ChevronRight,
  CreditCard,
  Loader2,
  Ruler,
  Shirt,
  User,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { MeasurementForm } from '@/components/orders/measurement-form';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { fetchApi } from '@/lib/fetch-api';
import { useCsrf } from '@/hooks/use-csrf';
import { useMeasurementDraft } from '@/hooks/use-measurement-draft';
import { offlineDb } from '@/lib/offline-db';
import { cn, GARMENT_TYPE_LABELS } from '@/lib/utils';

const MATERIAL_SOURCES = [
  { value: 'CLIENT_PROVIDED', label: 'Client Provided' },
  { value: 'TAILOR_PROVIDED', label: 'Tailor Provided' },
  { value: 'SPLIT', label: 'Split / Shared' },
];

const orderSchema = z.object({
  clientId: z.string().min(1, 'Please select a client.'),
  garmentType: z.string().min(1, 'Please select a garment type.'),
  materialSource: z.string(),
  description: z.string().optional(),
  dueDate: z.date().min(new Date(1900, 0, 1), 'A due date is required.'),
  amount: z.string().min(1, 'Amount is required'),
  deposit: z.string().optional(),
  // Measurements is a record of string keys and any values (numeric strings or numbers)
  measurements: z.record(z.string(), z.any()).optional(),
});

async function getClients(search: string = '') {
  const params = new URLSearchParams({ pageSize: '50' });
  if (search) params.append('search', search);
  const res = await fetch(`/api/clients?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch clients');
  const data = await res.json();
  return data.data;
}

const STEPS = [
  { id: 1, title: 'Client & Garment', icon: User },
  { id: 2, title: 'Measurements & Design', icon: Ruler },
  { id: 3, title: 'Review & Payment', icon: CreditCard },
];

export default function NewOrderPage() {
  const router = useRouter();
  const { csrfToken } = useCsrf();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: clients, isLoading: isLoadingClients } = useQuery({
    queryKey: ['clients', debouncedSearch],
    queryFn: () => getClients(debouncedSearch),
  });

  const form = useForm<z.infer<typeof orderSchema>>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      description: '',
      measurements: {},
      materialSource: 'CLIENT_PROVIDED',
      clientId: '',
      garmentType: '',
      amount: '',
      deposit: '',
    },
  });

  const watchedClientId = useWatch({ control: form.control, name: 'clientId' });

  // When using search, clients list is dynamic, so we might not find the selected client in the current list
  // if we cleared search or searched something else.
  // In a real app, we might want to keep the selected client in a separate state or cached.
  // For now, we try to find it in the current list.
  const selectedClient = clients?.find((c: any) => c.id === watchedClientId);

  // Auto-save measurement draft
  useMeasurementDraft(watchedClientId, form.control);

  async function onSubmit(values: z.infer<typeof orderSchema>) {
    setIsSubmitting(true);
    try {
      const payload = {
        clientId: values.clientId,
        garmentType: values.garmentType,
        garmentDescription: values.description,
        deadline: values.dueDate.toISOString(),
        // Parse amount safely - remove any non-numeric characters except decimal point
        laborCost: parseFloat(values.amount.toString().replace(/[^0-9.]/g, '')),
        measurements: values.measurements,
      };

      const response = await fetchApi('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to create order');

      toast.success('Order Created', {
        description: `Order #${data.data.orderNumber} has been created successfully.`,
      });

      // Clear local draft on success
      if (values.clientId) {
        await offlineDb.clearClientDrafts(values.clientId);
      }

      router.push('/dashboard/orders');
    } catch (error: any) {
      console.error(error);
      toast.error('Error', { description: error.message || 'Something went wrong.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  const nextStep = async () => {
    let isValid = false;
    if (step === 1) {
      isValid = await form.trigger(['clientId', 'garmentType']);
    } else if (step === 2) {
      isValid = true;
    }

    if (isValid) setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const watchedGarmentType = useWatch({ control: form.control, name: 'garmentType' });

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-heading text-primary">New Order Wizard</h1>
        <p className="text-muted-foreground">Create a streamlined order in 3 simple steps.</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8 relative">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -translate-y-1/2 rounded-full z-0" />
        <div
          className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 rounded-full z-0 transition-all duration-300"
          style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
        />
        <div className="flex justify-between relative z-10">
          {STEPS.map((s) => {
            const isActive = s.id === step;
            const isCompleted = s.id < step;
            return (
              <div key={s.id} className="flex flex-col items-center gap-2 bg-background px-2">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300',
                    isActive
                      ? 'border-primary bg-primary text-primary-foreground'
                      : isCompleted
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-gray-300 text-gray-400'
                  )}
                >
                  <s.icon className="w-5 h-5" />
                </div>
                <span
                  className={cn(
                    'text-xs font-medium transition-colors duration-300',
                    isActive || isCompleted ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Select Client</CardTitle>
                    <CardDescription>Search and select a client for this order.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="clientId"
                      render={({ field }) => (
                        <FormItem>
                          <div className="relative mb-4">
                            <Input
                              placeholder="Search client by name or phone..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="pl-4"
                            />
                          </div>

                          {field.value ? (
                            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 border border-primary/20">
                                  <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                                    {selectedClient ? selectedClient.name.charAt(0) : 'C'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-bold text-primary">
                                    {selectedClient ? selectedClient.name : 'Client Selected'}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {selectedClient ? selectedClient.phone : 'Details hidden'}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => form.setValue('clientId', '')}
                              >
                                Change
                              </Button>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2">
                              {isLoadingClients ? (
                                <div className="col-span-2 flex justify-center items-center gap-2 text-muted-foreground p-8">
                                  <Loader2 className="h-6 w-6 animate-spin" /> Searching clients...
                                </div>
                              ) : clients?.length === 0 ? (
                                <div className="col-span-2 text-center p-8 text-muted-foreground border rounded-md border-dashed">
                                  No clients found.{' '}
                                  <button
                                    type="button"
                                    className="text-primary cursor-pointer hover:underline"
                                    onClick={() => router.push('/dashboard/clients/new')}
                                  >
                                    Create new client
                                  </button>
                                </div>
                              ) : (
                                clients?.map((client: any) => (
                                  <button
                                    key={client.id}
                                    type="button"
                                    className={cn(
                                      'w-full p-3 rounded-md border cursor-pointer hover:border-primary transition-colors flex items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                                      field.value === client.id
                                        ? 'border-primary bg-primary/5'
                                        : 'bg-card'
                                    )}
                                    onClick={() => form.setValue('clientId', client.id)}
                                    aria-pressed={field.value === client.id}
                                  >
                                    <Avatar className="h-8 w-8">
                                      <AvatarFallback>{client.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="overflow-hidden">
                                      <p className="font-medium truncate">{client.name}</p>
                                      <p className="text-xs text-muted-foreground truncate">
                                        {client.phone}
                                      </p>
                                    </div>
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Garment Type</CardTitle>
                    <CardDescription>What are you making?</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="garmentType"
                      render={({ field }) => (
                        <FormItem>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {Object.entries(GARMENT_TYPE_LABELS).map(([key, label]) => (
                              <button
                                key={key}
                                type="button"
                                className={cn(
                                  'p-4 rounded-lg border cursor-pointer flex flex-col items-center justify-center gap-2 text-center transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                                  field.value === key
                                    ? 'border-primary bg-primary text-primary-foreground shadow-lg scale-105'
                                    : 'bg-card hover:border-primary/50'
                                )}
                                onClick={() => form.setValue('garmentType', key)}
                                aria-pressed={field.value === key}
                              >
                                <Shirt className="h-6 w-6" />
                                <span className="text-sm font-medium">{label}</span>
                              </button>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Design Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description & Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Detailed description of the style, fabric, embroidery, etc."
                              className="min-h-[120px] resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <MeasurementForm garmentType={watchedGarmentType} clientId={watchedClientId} />
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Logistics & Pricing</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Due Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={'outline'}
                                  className={cn(
                                    'w-full pl-3 text-left font-normal',
                                    !field.value && 'text-muted-foreground'
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, 'PPP')
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date()}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="materialSource"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Material Source</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select who provides material" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {MATERIAL_SOURCES.map((source) => (
                                <SelectItem key={source.value} value={source.value}>
                                  {source.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total Amount (GHS)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">
                                  ₵
                                </span>
                                <Input
                                  type="number"
                                  placeholder="0.00"
                                  step="0.01"
                                  {...field}
                                  className="pl-8 font-bold text-lg"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="deposit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Deposit Paid (GHS)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">
                                  ₵
                                </span>
                                <Input
                                  type="number"
                                  placeholder="0.00"
                                  step="0.01"
                                  {...field}
                                  className="pl-8"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-muted/30">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                      Order Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Client:</span>
                      <span>{selectedClient?.name || 'Client Selected'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Garment:</span>
                      <span>
                        {
                          GARMENT_TYPE_LABELS[
                            form.getValues('garmentType') as keyof typeof GARMENT_TYPE_LABELS
                          ]
                        }
                      </span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>GH₵ {form.getValues('amount')}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-between pt-4">
            {step > 1 ? (
              <Button type="button" variant="outline" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
            ) : (
              <Button type="button" variant="ghost" onClick={() => router.back()}>
                Cancel
              </Button>
            )}

            {step < 3 ? (
              <Button type="button" onClick={nextStep} className="ml-auto">
                Next Step <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="ml-auto bg-green-600 hover:bg-green-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" /> Confirm Order
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
