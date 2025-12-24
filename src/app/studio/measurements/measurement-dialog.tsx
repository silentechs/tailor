'use client';

import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Ruler, Save, X } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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
import { fetchApi } from '@/lib/fetch-api';
import { cn } from '@/lib/utils';

interface MeasurementDialogProps {
  initialValues?: Record<string, any>;
  unit?: string;
  trigger?: React.ReactNode;
}

const STANDARD_MEASUREMENTS = [
  'Chest',
  'Waist',
  'Hips',
  'Shoulder Width',
  'Sleeve Length',
  'Total Length',
  'Inseam',
  'Thigh',
];

export function MeasurementDialog({
  initialValues = {},
  unit = 'CM',
  trigger,
}: MeasurementDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [customFields, setCustomFields] = useState<string[]>([]);
  const queryClient = useQueryClient();

  // Merge initial keys with standard keys and custom fields
  const allKeys = Array.from(
    new Set([...STANDARD_MEASUREMENTS, ...Object.keys(initialValues), ...customFields])
  );

  const { register, handleSubmit, watch, setValue, unregister } = useForm<any>({
    defaultValues: { ...(initialValues as any), unit },
  });

  const selectedUnit = watch('unit') || 'CM';

  const handleAddCustomField = () => {
    if (!newFieldName.trim()) return;
    const formattedName = newFieldName.trim();
    if (allKeys.includes(formattedName)) {
      toast.error('Field already exists');
      return;
    }
    setCustomFields((prev) => [...prev, formattedName]);
    setNewFieldName('');
  };

  const handleRemoveCustomField = (key: string) => {
    setCustomFields((prev) => prev.filter((f) => f !== key));
    unregister(key);
  };

  async function onSubmit(data: any) {
    setIsSubmitting(true);
    try {
      // Clean up empty values and convert to numbers where appropriate
      const { unit: formUnit, ...justValues } = data;
      const cleanedValues = Object.entries(justValues).reduce((acc: any, [key, val]) => {
        if (val !== '' && val !== null) {
          acc[key] = isNaN(Number(val)) ? val : Number(val);
        }
        return acc;
      }, {});

      const res = await fetchApi('/api/studio/measurements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: cleanedValues, unit: formUnit }),
      });

      if (!res.ok) throw new Error('Failed to update measurements');

      toast.success('Measurements Updated', {
        description: 'Your profile has been updated successfully.',
      });

      queryClient.invalidateQueries({ queryKey: ['studio', 'measurements'] });
      setOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Update Failed', {
        description: 'Could not save measurements. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            className="bg-transparent rounded-2xl h-14 border-white/10 hover:bg-white/5 font-black uppercase tracking-widest text-[10px] px-8 text-white"
          >
            Edit Measurements
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-zinc-950 border-white/10 text-white max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black font-heading uppercase text-ghana-gold flex items-center gap-3">
            <Ruler className="h-6 w-6" />
            Update Measurements
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Enter your new measurements in {selectedUnit}. Only fill what you know.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div className="flex gap-4 p-4 bg-zinc-900 rounded-2xl border border-white/5">
            {['CM', 'INCH'].map((u) => (
              <Button
                key={u}
                type="button"
                variant={selectedUnit === u ? 'default' : 'ghost'}
                className={cn(
                  'flex-1 font-bold rounded-xl h-12',
                  selectedUnit === u ? 'bg-ghana-gold text-ghana-black' : ''
                )}
                onClick={() => setValue('unit', u)}
              >
                {u}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-8">
            {allKeys.map((key) => (
              <div key={key} className="space-y-2 group relative">
                <div className="flex justify-between items-center">
                  <Label
                    htmlFor={key}
                    className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 group-hover:text-ghana-gold transition-colors"
                  >
                    {key} ({selectedUnit.toLowerCase()})
                  </Label>
                  {!STANDARD_MEASUREMENTS.includes(key) && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomField(key)}
                      className="text-zinc-600 hover:text-red-500 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id={key}
                    type="number"
                    step="0.1"
                    className="bg-zinc-900 border-white/5 text-white focus:border-ghana-gold h-12 rounded-xl transition-all focus:ring-ghana-gold/20"
                    defaultValue={initialValues[key]}
                    {...register(key)}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-600 uppercase">
                    {selectedUnit}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5 space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
              Add Custom Measurement
            </Label>
            <div className="flex gap-3">
              <Input
                placeholder="e.g. Neck, Bicep, Wrist..."
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
                className="bg-zinc-900 border-white/5 text-white focus:border-ghana-gold h-12 rounded-xl"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomField();
                  }
                }}
              />
              <Button
                type="button"
                onClick={handleAddCustomField}
                className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold h-12 px-6 rounded-xl border border-white/5"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </div>

          <DialogFooter className="pt-6 border-t border-white/5">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="hover:bg-white/5 rounded-xl font-bold h-12"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-ghana-gold text-ghana-black hover:bg-ghana-gold/90 font-black uppercase tracking-widest text-[10px] h-12 px-8 rounded-xl shadow-lg shadow-ghana-gold/10"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Updates
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
