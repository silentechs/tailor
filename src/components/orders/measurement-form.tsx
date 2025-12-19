'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface MeasurementTemplate {
  id?: string;
  name: string;
  garmentType: string;
  fields: string[];
}

interface MeasurementFormProps {
  garmentType: string;
  clientId?: string;
}

export function MeasurementForm({ garmentType, clientId }: MeasurementFormProps) {
  const { control, setValue, watch, resetField } = useFormContext();
  const [customFields, setCustomFields] = useState<string[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');

  const { data: templates, isLoading: isLoadingTemplates } = useQuery<{
    data: MeasurementTemplate[];
  }>({
    queryKey: ['measurement-templates'],
    queryFn: () => fetch('/api/measurement-templates').then((res) => res.json()),
  });

  const { data: lastMeasurement, isLoading: isLoadingPrev } = useQuery({
    queryKey: ['client-measurements', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      const res = await fetch(`/api/clients/${clientId}/measurements`);
      const data = await res.json();
      return data.data;
    },
    enabled: !!clientId,
  });

  // Find template for current garment type
  const template = templates?.data.find((t) => t.garmentType === garmentType);
  const fields = template ? template.fields : [];

  // Combine template fields, custom fields, and fields from last measurement
  const prevFields = lastMeasurement?.values ? Object.keys(lastMeasurement.values) : [];
  const allFields = [...new Set([...fields, ...customFields, ...prevFields])];

  const loadPrevious = () => {
    if (lastMeasurement?.values) {
      Object.entries(lastMeasurement.values).forEach(([key, value]) => {
        setValue(`measurements.${key}`, value);
      });
    }
  };

  const handleAddField = () => {
    if (newFieldName.trim()) {
      const formatted = newFieldName.trim().toLowerCase().replace(/\s+/g, '_');
      if (!allFields.includes(formatted)) {
        setCustomFields([...customFields, formatted]);
        setNewFieldName('');
        setIsAddOpen(false);
      }
    }
  };

  const removeCustomField = (field: string) => {
    setCustomFields(customFields.filter((f) => f !== field));
    setValue(`measurements.${field}`, undefined);
  };

  if (isLoadingTemplates) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          {template?.name || 'Standard'} Measurements
        </h3>
        <div className="flex gap-2">
          {lastMeasurement && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={loadPrevious}
              className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
            >
              <Loader2 className={cn('h-4 w-4 mr-2', isLoadingPrev && 'animate-spin')} />
              Load Last ({new Date(lastMeasurement.createdAt).toLocaleDateString()})
            </Button>
          )}
          <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Custom
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {allFields.map((field) => {
          const isCustom = customFields.includes(field);
          return (
            <FormField
              key={field}
              control={control}
              name={`measurements.${field}`}
              render={({ field: inputField }) => (
                <FormItem className="relative">
                  <FormLabel className="flex items-center justify-between text-xs capitalize text-muted-foreground">
                    {field.replace(/_/g, ' ')}
                    {isCustom && (
                      <button
                        type="button"
                        onClick={() => removeCustomField(field)}
                        className="text-destructive hover:text-red-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="0.0"
                        {...inputField}
                        className="text-center font-mono pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-medium">
                        IN
                      </span>
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
          );
        })}
      </div>

      {allFields.length === 0 && !isLoadingTemplates && (
        <div className="text-center py-8 bg-muted/20 rounded-lg border border-dashed">
          <p className="text-sm text-muted-foreground">
            No measurement fields defined for this garment type.
          </p>
          <Button type="button" variant="link" onClick={() => setIsAddOpen(true)}>
            Add your first field
          </Button>
        </div>
      )}

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Measurement</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <FormLabel>Field Name</FormLabel>
            <Input
              placeholder="e.g. Neck Size, Thigh"
              value={newFieldName}
              onChange={(e) => setNewFieldName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddField())}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Common fields include: Neck, Wrist, Ankle, Under Bust, etc.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddField}>Add Field</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
