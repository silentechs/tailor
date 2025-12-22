'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import {
  CalendarIcon,
  Check,
  ChevronRight,
  FileText,
  Loader2,
  Plus,
  Ruler,
  Search,
  Shirt,
  Trash2,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { fetchApi } from '@/lib/fetch-api';
import { cn, GARMENT_TYPE_LABELS } from '@/lib/utils';

// --- Schemas ---

const commonDetailsSchema = z.object({
  collectionName: z.string().min(2, 'Collection name is required'),
  garmentType: z.string().min(1, 'Garment type is required'),
  description: z.string().optional(),
  deadline: z.date().optional().or(z.literal(undefined)),
  basePrice: z.string().optional(),
});

import { v4 as uuidv4 } from 'uuid';

// --- Types ---

type Client = {
  id: string;
  name: string;
  phone: string;
  measurements?: any;
};

type SelectionItem = {
  tempId: string;
  clientId: string;
  name: string;
  phone: string;
  measurements?: any;
};

type WizardState = {
  step: number;
  selectedItems: SelectionItem[];
  commonDetails: z.infer<typeof commonDetailsSchema>;
  individualOverrides: Record<
    string,
    {
      // Keyed by tempId
      measurements?: any;
      price?: string;
      notes?: string;
      recipientLabel?: string;
    }
  >;
};

// --- Constants ---

const STEPS = [
  { id: 1, title: 'Select Recipients', icon: Users },
  { id: 2, title: 'Order Details', icon: Shirt },
  { id: 3, title: 'Review & Finalize', icon: FileText },
];

// --- API Helpers ---

async function getClients(search: string = '') {
  const params = new URLSearchParams({ pageSize: '100' });
  if (search) params.append('search', search);
  const res = await fetchApi(`/api/clients?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch clients');
  const data = await res.json();
  return data.data;
}

async function createClient(data: { name: string; phone: string }) {
  const res = await fetchApi('/api/clients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to create client');
  }
  return res.json();
}

async function createOrderCollection(data: any) {
  const res = await fetchApi('/api/order-collections', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || error.error || 'Failed to create collection');
  }
  return res.json();
}

async function saveDraft(data: WizardState) {
  const res = await fetchApi('/api/bulk-order-drafts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: {
        selectedItems: data.selectedItems,
        commonDetails: {
          ...data.commonDetails,
          deadline: data.commonDetails.deadline?.toISOString(), // Serialize date
        },
        individualOverrides: data.individualOverrides,
      },
      step: data.step,
    }),
  });
  return res.json();
}

export default function BulkOrderWizard() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // State
  const [step, setStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<SelectionItem[]>([]);
  const [individualOverrides, setIndividualOverrides] = useState<Record<string, any>>({});

  // New Client State
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [isCreatingClient, setIsCreatingClient] = useState(false);

  // Measurement State
  const [isMeasurementOpen, setIsMeasurementOpen] = useState(false);
  const [currentMeasurementItem, setCurrentMeasurementItem] = useState<SelectionItem | null>(null);
  const [measurementValues, setMeasurementValues] = useState<Record<string, string | number>>({});
  const [newMeasurementLabel, setNewMeasurementLabel] = useState('');

  // Form for Step 2
  const form = useForm<z.infer<typeof commonDetailsSchema>>({
    resolver: zodResolver(commonDetailsSchema),
    defaultValues: {
      collectionName: '',
      description: '',
      basePrice: '',
    },
  });

  // Fetch Clients
  const { data: clients, isLoading: isLoadingClients } = useQuery({
    queryKey: ['clients', searchTerm],
    queryFn: () => getClients(searchTerm),
  });

  // Auto-save Draft Logic (Debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (selectedItems.length > 0 || form.formState.isDirty) {
        // Wrap in try-catch to prevent unhandled rejections crashing the app
        try {
          const values = form.getValues();
          // Only save if date is valid or not set
          const deadline =
            values.deadline instanceof Date && !Number.isNaN(values.deadline.getTime())
              ? values.deadline.toISOString()
              : undefined;

          saveDraft({
            step,
            selectedItems,
            commonDetails: {
              ...values,
              deadline: deadline as any, // Allow undefined for draft
            },
            individualOverrides,
          }).catch(console.error);
        } catch (e) {
          console.error('Auto-save failed', e);
        }
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [step, selectedItems, individualOverrides, form.formState.isDirty, form.getValues]); // Watch form values

  // Handlers
  const addClient = (client: Client) => {
    const newItem: SelectionItem = {
      tempId: uuidv4(),
      clientId: client.id,
      name: client.name,
      phone: client.phone,
      measurements: client.measurements,
    };
    setSelectedItems((prev) => [...prev, newItem]);
  };

  const removeClientItem = (tempId: string) => {
    setSelectedItems((prev) => prev.filter((item) => item.tempId !== tempId));
    setIndividualOverrides((prev) => {
      const newOverrides = { ...prev };
      delete newOverrides[tempId];
      return newOverrides;
    });
  };

  const handleCreateClient = async () => {
    if (!newClientName || !newClientPhone) return;
    setIsCreatingClient(true);
    try {
      const res = await createClient({ name: newClientName, phone: newClientPhone });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client Created');
      setIsAddClientOpen(false);
      setNewClientName('');
      setNewClientPhone('');
      // Auto select the new client
      if (res.data) {
        addClient(res.data);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsCreatingClient(false);
    }
  };

  const openMeasurementDialog = (item: SelectionItem) => {
    setCurrentMeasurementItem(item);
    // Load existing measurements (either from override or client default)
    const override = individualOverrides[item.tempId]?.measurements || item.measurements || {};
    setMeasurementValues(override);
    setIsMeasurementOpen(true);
    setNewMeasurementLabel('');
  };

  const saveMeasurements = () => {
    if (currentMeasurementItem) {
      // Convert to numbers where possible for consistency, but keep strings if needed
      const formattedMeasurements: Record<string, number | string> = {};
      Object.entries(measurementValues).forEach(([key, val]) => {
        const num = parseFloat(String(val));
        formattedMeasurements[key] = !Number.isNaN(num) && String(val).trim() !== '' ? num : val;
      });

      setIndividualOverrides((prev) => ({
        ...prev,
        [currentMeasurementItem.tempId]: {
          ...prev[currentMeasurementItem.tempId],
          measurements: formattedMeasurements,
        },
      }));
      toast.success('Measurements updated for this order');
      setIsMeasurementOpen(false);
    }
  };

  const handleNext = async () => {
    if (step === 1) {
      if (selectedItems.length === 0) {
        toast.error('Please select at least one item');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      try {
        const isValid = await form.trigger();
        if (isValid) {
          setStep(3);
        }
      } catch (error) {
        console.error('Validation error:', error);
        toast.error('Please check the form for errors');
      }
    }
  };

  const handleSubmit = async () => {
    try {
      const commonValues = form.getValues();

      // Construct payload
      const payload = {
        name: commonValues.collectionName,
        description: commonValues.description,
        deadline: commonValues.deadline?.toISOString() || null,
        orders: selectedItems.map((item) => {
          const override = individualOverrides[item.tempId] || {};

          // Combine description with specific recipient label/notes
          let notes = override.notes || '';
          if (override.recipientLabel) {
            notes = `Recipient: ${override.recipientLabel}\n${notes}`;
          }

          return {
            clientId: item.clientId,
            garmentType: commonValues.garmentType,
            garmentDescription: commonValues.description,
            quantity: 1,
            laborCost: parseFloat(override.price || commonValues.basePrice || '0'),
            totalAmount: parseFloat(override.price || commonValues.basePrice || '0'),
            deadline: commonValues.deadline?.toISOString() || null,
            measurements: override.measurements || item.measurements || {},
            // Defaults
            materialSource: 'CLIENT_PROVIDED',
            paidAmount: 0,
            styleNotes: notes.trim(),
          };
        }),
      };

      await createOrderCollection(payload);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Bulk Order Created Successfully');
      router.push('/dashboard/orders');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to create bulk order');
    }
  };

  // Render Steps
  return (
    <div className="max-w-5xl mx-auto pb-12 animate-in fade-in duration-500 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-heading text-primary">Bulk Order Wizard</h1>
        <p className="text-muted-foreground">Create orders for multiple clients in one go.</p>
      </div>

      {/* Progress */}
      <div className="relative">
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
                    isActive || isCompleted
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

      {/* Step 1: Select Recipients */}
      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Select Clients</CardTitle>
                <CardDescription>
                  Add recipients for this order. ({selectedItems.length} items)
                </CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={() => setIsAddClientOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> New Client
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 h-[400px]">
                {/* Left: Search & Add */}
                <div className="flex-1 flex flex-col gap-4 border rounded-md p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search clients..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  <ScrollArea className="flex-1">
                    {isLoadingClients ? (
                      <div className="flex justify-center items-center h-full text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading clients...
                      </div>
                    ) : clients?.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground">
                        No clients found.
                      </div>
                    ) : (
                      <div className="space-y-2 pr-2">
                        {clients?.map((client: Client) => {
                          const count = selectedItems.filter(
                            (i) => i.clientId === client.id
                          ).length;
                          return (
                            <div
                              key={client.id}
                              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:border-primary/50 transition-colors"
                            >
                              <div className="flex items-center gap-3 overflow-hidden">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>{client.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="overflow-hidden">
                                  <p className="font-medium truncate">{client.name}</p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {client.phone}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {count > 0 && <Badge variant="secondary">{count} selected</Badge>}
                                <Button size="sm" variant="ghost" onClick={() => addClient(client)}>
                                  <Plus className="h-4 w-4" /> Add
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </div>

                {/* Right: Selected Items List */}
                <div className="w-1/3 border rounded-md p-4 flex flex-col bg-muted/10">
                  <h3 className="font-medium mb-2 text-sm">
                    Selected Items ({selectedItems.length})
                  </h3>
                  <ScrollArea className="flex-1">
                    {selectedItems.length === 0 ? (
                      <div className="text-center py-10 text-xs text-muted-foreground">
                        No items added yet.
                      </div>
                    ) : (
                      <div className="space-y-2 pr-2">
                        {selectedItems.map((item, idx) => (
                          <div
                            key={item.tempId}
                            className="flex items-center justify-between p-2 bg-background rounded border text-sm animate-in fade-in zoom-in-95 duration-200"
                          >
                            <div className="truncate flex-1">
                              <span className="font-medium">{item.name}</span>
                              <span className="text-xs text-muted-foreground ml-2">#{idx + 1}</span>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={() => removeClientItem(item.tempId)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <div className="text-sm text-muted-foreground">
                {selectedItems.length} items selected
              </div>
              <Button type="button" onClick={handleNext} disabled={selectedItems.length === 0}>
                Next Step <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      )}

      {/* Step 2: Common Details */}
      {step === 2 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Form {...form}>
            <form className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Order Details</CardTitle>
                  <CardDescription>
                    Define the common details for all orders in this collection.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="collectionName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Collection Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Wedding Party 2024" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="garmentType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Garment Type</FormLabel>
                          <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto p-1 border rounded-md">
                            {Object.entries(GARMENT_TYPE_LABELS).map(([key, label]) => (
                              <button
                                key={key}
                                type="button"
                                className={cn(
                                  'p-2 text-sm rounded cursor-pointer text-center border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                                  field.value === key
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'hover:bg-muted'
                                )}
                                onClick={() => form.setValue('garmentType', key)}
                                aria-pressed={field.value === key}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="deadline"
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
                        name="basePrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Base Price per Item (GHS)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                  ₵
                                </span>
                                <Input type="number" step="0.01" className="pl-8" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description / Style Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Details about fabric, style, etc."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="justify-between">
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button type="button" onClick={handleNext}>
                    Next Step <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </Form>
        </motion.div>
      )}

      {/* Step 3: Review & Finalize */}
      {step === 3 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Review Orders</CardTitle>
              <CardDescription>
                Review generated orders for <strong>{form.getValues('collectionName')}</strong>. You
                can customize price or notes for specific clients.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-12 gap-4 font-medium text-sm text-muted-foreground px-4">
                  <div className="col-span-3">Client</div>
                  <div className="col-span-2">Label (Opt)</div>
                  <div className="col-span-2">Price</div>
                  <div className="col-span-3">Notes</div>
                  <div className="col-span-2 text-center">Measure</div>
                </div>
                <Separator />
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {selectedItems.map((item, idx) => {
                    const override = individualOverrides[item.tempId] || {};
                    const hasMeasurements =
                      (override.measurements && Object.keys(override.measurements).length > 0) ||
                      (item.measurements && Object.keys(item.measurements).length > 0);

                    return (
                      <div
                        key={item.tempId}
                        className="grid grid-cols-12 gap-4 items-center p-3 bg-muted/20 rounded-md animate-in fade-in slide-in-from-top-2 duration-200"
                      >
                        <div className="col-span-3 flex items-center gap-3 overflow-hidden">
                          <Badge
                            variant="outline"
                            className="h-6 w-6 flex items-center justify-center p-0 shrink-0"
                          >
                            {idx + 1}
                          </Badge>
                          <div className="overflow-hidden">
                            <p className="font-medium truncate">{item.name}</p>
                          </div>
                        </div>
                        <div className="col-span-2">
                          <Input
                            placeholder="e.g. Student A"
                            value={override.recipientLabel || ''}
                            onChange={(e) =>
                              setIndividualOverrides((prev) => ({
                                ...prev,
                                [item.tempId]: {
                                  ...prev[item.tempId],
                                  recipientLabel: e.target.value,
                                },
                              }))
                            }
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            value={override.price ?? form.getValues('basePrice')}
                            onChange={(e) =>
                              setIndividualOverrides((prev) => ({
                                ...prev,
                                [item.tempId]: { ...prev[item.tempId], price: e.target.value },
                              }))
                            }
                            className="h-8"
                          />
                        </div>
                        <div className="col-span-3">
                          <Input
                            placeholder="Specific notes..."
                            value={override.notes || ''}
                            onChange={(e) =>
                              setIndividualOverrides((prev) => ({
                                ...prev,
                                [item.tempId]: { ...prev[item.tempId], notes: e.target.value },
                              }))
                            }
                            className="h-8"
                          />
                        </div>
                        <div className="col-span-2 flex justify-center gap-2">
                          <Button
                            size="sm"
                            variant={hasMeasurements ? 'default' : 'outline'}
                            className={cn(
                              'h-8 w-8 p-0',
                              hasMeasurements && 'bg-blue-600 hover:bg-blue-700'
                            )}
                            onClick={() => openMeasurementDialog(item)}
                            title="Edit Measurements"
                          >
                            <Ruler className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => removeClientItem(item.tempId)}
                            title="Remove Item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end pt-4">
                  <div className="bg-primary/10 p-4 rounded-lg text-right">
                    <p className="text-sm text-muted-foreground">Total Estimated Revenue</p>
                    <p className="text-2xl font-bold text-primary">
                      GH₵{' '}
                      {selectedItems
                        .reduce((acc, item) => {
                          const price =
                            individualOverrides[item.tempId]?.price || form.getValues('basePrice');
                          return acc + (parseFloat(price) || 0);
                        }, 0)
                        .toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="mr-2 h-4 w-4" /> Create Collection & Orders
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      )}
      {/* Measurement Dialog */}
      <Dialog open={isMeasurementOpen} onOpenChange={setIsMeasurementOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Measurements for {currentMeasurementItem?.name}</DialogTitle>
            <DialogDescription>Enter measurements for this order.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px] pr-4">
            <div className="space-y-4 py-2">
              {/* Common Measurements */}
              <div className="grid grid-cols-2 gap-4">
                {['Chest', 'Waist', 'Hips', 'Shoulder', 'Sleeve', 'Length'].map((label) => {
                  const inputId = `measurement-${label.toLowerCase()}`;
                  return (
                    <div key={label} className="space-y-1">
                      <label
                        htmlFor={inputId}
                        className="text-xs font-medium text-muted-foreground"
                      >
                        {label}
                      </label>
                      <Input
                        id={inputId}
                        type="number"
                        value={measurementValues[label] || ''}
                        onChange={(e) =>
                          setMeasurementValues((prev) => ({
                            ...prev,
                            [label]: e.target.value,
                          }))
                        }
                        placeholder="0"
                      />
                    </div>
                  );
                })}
              </div>

              <Separator />

              {/* Custom Measurements */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Custom Measurements</p>
                {Object.entries(measurementValues)
                  .filter(
                    ([key]) =>
                      !['Chest', 'Waist', 'Hips', 'Shoulder', 'Sleeve', 'Length'].includes(key)
                  )
                  .map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Input value={key} disabled className="flex-1 bg-muted" />
                      <Input
                        type="number"
                        value={value}
                        onChange={(e) =>
                          setMeasurementValues((prev) => ({
                            ...prev,
                            [key]: e.target.value,
                          }))
                        }
                        className="w-24"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          setMeasurementValues((prev) => {
                            const next = { ...prev };
                            delete next[key];
                            return next;
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}

                <div className="flex gap-2 items-end pt-2">
                  <div className="flex-1 space-y-1">
                    <label htmlFor="new-measurement-label" className="text-xs">
                      New Label
                    </label>
                    <Input
                      id="new-measurement-label"
                      value={newMeasurementLabel}
                      onChange={(e) => setNewMeasurementLabel(e.target.value)}
                      placeholder="e.g. Inseam"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newMeasurementLabel) {
                            setMeasurementValues((prev) => ({
                              ...prev,
                              [newMeasurementLabel]: '',
                            }));
                            setNewMeasurementLabel('');
                          }
                        }
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (newMeasurementLabel) {
                        setMeasurementValues((prev) => ({
                          ...prev,
                          [newMeasurementLabel]: '',
                        }));
                        setNewMeasurementLabel('');
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMeasurementOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveMeasurements}>Save Measurements</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Client Dialog - Moved outside to prevent hydration mismatch on trigger */}
      <Dialog open={isAddClientOpen} onOpenChange={setIsAddClientOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
            <DialogDescription>Create a new client to add to this order.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="new-client-name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="new-client-name"
                placeholder="Full Name"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="new-client-phone" className="text-sm font-medium">
                Phone
              </label>
              <Input
                id="new-client-phone"
                placeholder="Phone Number"
                value={newClientPhone}
                onChange={(e) => setNewClientPhone(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddClientOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateClient}
              disabled={isCreatingClient || !newClientName || !newClientPhone}
            >
              {isCreatingClient && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
