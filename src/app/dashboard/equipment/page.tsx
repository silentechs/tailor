'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Hammer,
  History,
  Loader2,
  Plus,
  Save,
  Settings,
  Wrench,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

async function getEquipment() {
  const res = await fetch('/api/equipment');
  if (!res.ok) throw new Error('Failed to fetch equipment');
  return res.json();
}

async function getMaintenanceLogs(equipmentId: string) {
  const res = await fetch(`/api/maintenance?equipmentId=${equipmentId}`);
  if (!res.ok) throw new Error('Failed to fetch maintenance logs');
  return res.json();
}

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active', color: 'bg-emerald-500' },
  { value: 'MAINTENANCE', label: 'Under Maintenance', color: 'bg-amber-500' },
  { value: 'BROKEN', label: 'Broken', color: 'bg-red-500' },
  { value: 'RETIRED', label: 'Retired', color: 'bg-slate-500' },
];

const MAINTENANCE_TYPES = [
  { value: 'ROUTINE', label: 'Routine Service' },
  { value: 'REPAIR', label: 'Repair' },
  { value: 'OVERHAUL', label: 'Overhaul' },
  { value: 'CALIBRATION', label: 'Calibration' },
];

export default function EquipmentPage() {
  const queryClient = useQueryClient();
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null);
  const [showLogsSheet, setShowLogsSheet] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

  const { data: equipmentData, isLoading } = useQuery({
    queryKey: ['equipment'],
    queryFn: getEquipment,
  });

  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ['maintenance-logs', selectedEquipment?.id],
    queryFn: () => getMaintenanceLogs(selectedEquipment?.id),
    enabled: !!selectedEquipment?.id && showLogsSheet,
  });

  const items = equipmentData?.data || [];
  const logs = logsData?.data || [];

  const getStatusColor = (status: string) => {
    const option = STATUS_OPTIONS.find((s) => s.value === status);
    return option?.color || 'bg-slate-500';
  };

  const handleViewLogs = (item: any) => {
    setSelectedEquipment(item);
    setShowLogsSheet(true);
  };

  const handleOpenSettings = (item: any) => {
    setSelectedEquipment(item);
    setShowSettingsDialog(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold font-heading text-primary">Equipment & Tools</h1>
          <p className="text-muted-foreground mt-1">
            Manage workshop assets and maintenance records.
          </p>
        </div>
        <AddEquipmentDialog />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.length > 0 ? (
          items.map((item: any) => (
            <Card key={item.id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="h-10 w-10 rounded-lg bg-primary/5 flex items-center justify-center border border-primary/10">
                    <Hammer className="h-5 w-5 text-primary opacity-70" />
                  </div>
                  <Badge className={cn('text-[10px] font-bold', getStatusColor(item.status))}>
                    {STATUS_OPTIONS.find((s) => s.value === item.status)?.label || item.status}
                  </Badge>
                </div>
                <CardTitle className="mt-4">{item.name}</CardTitle>
                <CardDescription>
                  {item.brand} {item.model}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Serial Number</span>
                    <span className="font-mono">{item.serialNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Last Maintained</span>
                    <span>
                      {item.maintenance?.[0]
                        ? formatDate(item.maintenance[0].completedDate)
                        : 'Never'}
                    </span>
                  </div>
                  {item.purchaseDate && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Purchase Date</span>
                      <span>{formatDate(item.purchaseDate)}</span>
                    </div>
                  )}
                </div>

                {item.status === 'ACTIVE' && (
                  <div className="bg-emerald-50 p-2 rounded-lg flex items-center gap-2 text-emerald-700 text-xs font-medium">
                    <CheckCircle2 className="h-3 w-3" />
                    Operating normally
                  </div>
                )}
                {item.status === 'MAINTENANCE' && (
                  <div className="bg-amber-50 p-2 rounded-lg flex items-center gap-2 text-amber-700 text-xs font-medium">
                    <Wrench className="h-3 w-3" />
                    Under maintenance
                  </div>
                )}
                {item.status === 'BROKEN' && (
                  <div className="bg-red-50 p-2 rounded-lg flex items-center gap-2 text-red-700 text-xs font-medium">
                    <AlertTriangle className="h-3 w-3" />
                    Needs repair
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleViewLogs(item)}
                >
                  <History className="h-3 w-3 mr-2" /> Logs
                </Button>
                <Button size="sm" className="flex-1" onClick={() => handleOpenSettings(item)}>
                  <Settings className="h-3 w-3 mr-2" /> Settings
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-20 bg-slate-50 border-2 border-dashed rounded-2xl text-center">
            <Wrench className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-600">No equipment registered</h3>
            <p className="text-sm text-slate-500 max-w-xs mx-auto mt-1">
              Add your sewing machines, irons, and other workshop tools to keep track of their
              health.
            </p>
            <AddEquipmentDialog
              trigger={
                <Button className="mt-6">
                  <Plus className="h-4 w-4 mr-2" /> Add First Item
                </Button>
              }
            />
          </div>
        )}
      </div>

      {/* Maintenance Logs Sheet */}
      <Sheet open={showLogsSheet} onOpenChange={setShowLogsSheet}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Maintenance History
            </SheetTitle>
            <SheetDescription>
              {selectedEquipment?.name} - {selectedEquipment?.brand} {selectedEquipment?.model}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <AddMaintenanceDialog
              equipmentId={selectedEquipment?.id}
              onSuccess={() => {
                queryClient.invalidateQueries({
                  queryKey: ['maintenance-logs', selectedEquipment?.id],
                });
                queryClient.invalidateQueries({ queryKey: ['equipment'] });
              }}
            />

            {logsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-8 w-8 mx-auto opacity-20 mb-2" />
                <p>No maintenance records yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log: any) => (
                  <div
                    key={log.id}
                    className="p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {MAINTENANCE_TYPES.find((t) => t.value === log.type)?.label || log.type}
                          </Badge>
                          <Badge
                            className={cn(
                              'text-[10px]',
                              log.status === 'COMPLETED' && 'bg-green-500',
                              log.status === 'SCHEDULED' && 'bg-blue-500',
                              log.status === 'IN_PROGRESS' && 'bg-amber-500',
                              log.status === 'CANCELLED' && 'bg-slate-500'
                            )}
                          >
                            {log.status}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium mt-2">{log.description}</p>
                        {log.notes && (
                          <p className="text-xs text-muted-foreground mt-1">{log.notes}</p>
                        )}
                      </div>
                      {log.cost && (
                        <span className="text-sm font-bold">{formatCurrency(log.cost)}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(log.completedDate)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Equipment Settings Dialog */}
      <EquipmentSettingsDialog
        equipment={selectedEquipment}
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
      />
    </div>
  );
}

function AddEquipmentDialog({ trigger }: { trigger?: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch('/api/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Failed to add equipment');

      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      toast.success('Equipment added successfully');
      setOpen(false);
    } catch (_error) {
      toast.error('Failed to add equipment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" /> Add Equipment
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Add New Equipment</DialogTitle>
            <DialogDescription>Enter the details of your workshop item below.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Item Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Sewing Machine / Industrial Iron"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="brand">Brand</Label>
                <Input id="brand" name="brand" placeholder="Brother / Singer" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="model">Model</Label>
                <Input id="model" name="model" placeholder="S-7100A / etc" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="serialNumber">Serial Number</Label>
              <Input id="serialNumber" name="serialNumber" placeholder="Optional" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input id="purchaseDate" name="purchaseDate" type="date" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Equipment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddMaintenanceDialog({
  equipmentId,
  onSuccess,
}: {
  equipmentId?: string;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!equipmentId) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      equipmentId,
      type: formData.get('type'),
      description: formData.get('description'),
      cost: formData.get('cost') ? Number(formData.get('cost')) : null,
      notes: formData.get('notes') || null,
      status: 'COMPLETED',
    };

    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Failed to add maintenance record');

      toast.success('Maintenance record added');
      setOpen(false);
      onSuccess?.();
    } catch (_error) {
      toast.error('Failed to add maintenance record');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Plus className="h-4 w-4 mr-2" /> Add Maintenance Record
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Log Maintenance</DialogTitle>
            <DialogDescription>Record a maintenance activity for this equipment.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="type">Maintenance Type</Label>
              <Select name="type" required defaultValue="ROUTINE">
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {MAINTENANCE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="What was done?"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cost">Cost (GHS)</Label>
              <Input id="cost" name="cost" type="number" step="0.01" placeholder="0.00" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" placeholder="Additional notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Record
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EquipmentSettingsDialog({
  equipment,
  open,
  onOpenChange,
}: {
  equipment: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!equipment?.id) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch(`/api/equipment/${equipment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Failed to update equipment');

      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      toast.success('Equipment updated successfully');
      onOpenChange(false);
    } catch (_error) {
      toast.error('Failed to update equipment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!equipment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Equipment Settings</DialogTitle>
            <DialogDescription>Update details for {equipment.name}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={equipment.name} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="brand">Brand</Label>
                <Input id="brand" name="brand" defaultValue={equipment.brand} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="model">Model</Label>
                <Input id="model" name="model" defaultValue={equipment.model} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="serialNumber">Serial Number</Label>
              <Input
                id="serialNumber"
                name="serialNumber"
                defaultValue={equipment.serialNumber}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue={equipment.status}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
