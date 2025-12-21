'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Loader2, Ruler, Save } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface MeasurementDialogProps {
    initialValues?: Record<string, any>;
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

export function MeasurementDialog({ initialValues = {}, trigger }: MeasurementDialogProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const queryClient = useQueryClient();

    // Merge initial keys with standard keys to ensure form has fields
    const allKeys = Array.from(new Set([...Object.keys(initialValues), ...STANDARD_MEASUREMENTS]));

    const { register, handleSubmit, reset } = useForm({
        defaultValues: initialValues,
    });

    async function onSubmit(data: any) {
        setIsSubmitting(true);
        try {
            // Clean up empty values and convert to numbers where appropriate
            const cleanedValues = Object.entries(data).reduce((acc: any, [key, val]) => {
                if (val !== '' && val !== null) {
                    acc[key] = Number(val);
                }
                return acc;
            }, {});

            const res = await fetch('/api/studio/measurements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ values: cleanedValues }),
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
                    <Button variant="outline" className="rounded-2xl h-14 border-white/10 hover:bg-white/5 font-black uppercase tracking-widest text-[10px] px-8">
                        Edit Measurements
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-zinc-950 border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black font-heading uppercase text-ghana-gold flex items-center gap-3">
                        <Ruler className="h-6 w-6" />
                        Update Measurements
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Enter your new measurements in CM. Only fill what you know.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        {allKeys.map((key) => (
                            <div key={key} className="space-y-2">
                                <Label htmlFor={key} className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                                    {key} (cm)
                                </Label>
                                <div className="relative">
                                    <Input
                                        id={key}
                                        type="number"
                                        step="0.1"
                                        className="bg-zinc-900 border-white/10 text-white focus:border-ghana-gold h-12"
                                        defaultValue={initialValues[key]}
                                        {...register(key)}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-600">CM</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setOpen(false)}
                            className="hover:bg-white/5"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-ghana-gold text-ghana-black hover:bg-ghana-gold/90 font-bold"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Updates
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
