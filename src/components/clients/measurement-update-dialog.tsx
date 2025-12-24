'use client';

import { useState } from 'react';
import { Edit, Loader2, Plus, Ruler, Save, X } from 'lucide-react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchApi } from '@/lib/fetch-api';

interface MeasurementUpdateDialogProps {
    clientId: string;
    clientName: string;
    measurements: Record<string, any> | null;
    unit: string;
    onUpdateComplete?: () => void;
}

export function MeasurementUpdateDialog({
    clientId,
    clientName,
    measurements,
    unit,
    onUpdateComplete,
}: MeasurementUpdateDialogProps) {
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [selectedUnit, setSelectedUnit] = useState(unit || 'CM');
    const [values, setValues] = useState<Record<string, string>>({});
    const [newFieldName, setNewFieldName] = useState('');
    const [showAddField, setShowAddField] = useState(false);

    // Parse existing measurements - handle nested structure
    const initializeValues = () => {
        let measurementData = measurements || {};

        // If measurements contains a nested 'values' object, use that
        if (measurementData.values && typeof measurementData.values === 'object') {
            measurementData = measurementData.values;
        }

        // Filter out metadata keys, keep only measurement values
        const filtered = Object.fromEntries(
            Object.entries(measurementData).filter(
                ([key, value]) =>
                    !['unit', 'updatedAt', 'createdAt', 'id', 'clientId', 'templateId', 'notes', 'sketch', 'isSynced', 'clientSideId'].includes(key) &&
                    (typeof value === 'number' || typeof value === 'string')
            ).map(([key, value]) => [key, String(value)])
        );

        setValues(filtered);
    };

    const handleOpenChange = (isOpen: boolean) => {
        if (isOpen) {
            initializeValues();
        }
        setOpen(isOpen);
        setShowAddField(false);
        setNewFieldName('');
    };

    const handleValueChange = (key: string, value: string) => {
        setValues((prev) => ({ ...prev, [key]: value }));
    };

    const handleAddField = () => {
        if (!newFieldName.trim()) return;

        const fieldName = newFieldName.trim().toLowerCase().replace(/\s+/g, '_');
        if (values[fieldName] !== undefined) {
            toast.error('Field already exists');
            return;
        }

        setValues((prev) => ({ ...prev, [fieldName]: '' }));
        setNewFieldName('');
        setShowAddField(false);
    };

    const handleRemoveField = (key: string) => {
        setValues((prev) => {
            const updated = { ...prev };
            delete updated[key];
            return updated;
        });
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            // Convert string values to numbers where possible
            const numericValues: Record<string, number | string> = {};
            Object.entries(values).forEach(([key, val]) => {
                const num = parseFloat(val);
                numericValues[key] = isNaN(num) ? val : num;
            });

            const res = await fetchApi(`/api/clients/${clientId}/measurements`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    values: numericValues,
                    unit: selectedUnit,
                    notes: 'Updated via measurements dialog',
                }),
            });

            if (!res.ok) {
                throw new Error('Failed to save measurements');
            }

            toast.success('Measurements Updated', {
                description: `Successfully saved measurements for ${clientName}`,
            });

            setOpen(false);
            onUpdateComplete?.();
        } catch (error) {
            console.error('Save error:', error);
            toast.error('Save Failed', {
                description: 'Could not save measurements. Please try again.',
            });
        } finally {
            setSaving(false);
        }
    };

    const measurementKeys = Object.keys(values);

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Update
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Ruler className="h-5 w-5 text-primary" />
                        Update Measurements
                    </DialogTitle>
                    <DialogDescription>
                        Edit measurements for {clientName}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Unit Selection */}
                    <div className="flex items-center gap-4">
                        <Label className="w-20">Unit</Label>
                        <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                            <SelectTrigger className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="CM">Centimeters</SelectItem>
                                <SelectItem value="INCH">Inches</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Measurements Grid */}
                    <ScrollArea className="h-[300px] rounded-lg border p-4">
                        <div className="space-y-3">
                            {measurementKeys.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">
                                    No measurements yet. Click "Add Field" to start.
                                </p>
                            ) : (
                                measurementKeys.map((key) => (
                                    <div key={key} className="flex items-center gap-3">
                                        <Label className="w-32 text-sm capitalize truncate" title={key.replace(/_/g, ' ')}>
                                            {key.replace(/_/g, ' ')}
                                        </Label>
                                        <Input
                                            type="number"
                                            step="0.1"
                                            value={values[key]}
                                            onChange={(e) => handleValueChange(key, e.target.value)}
                                            className="flex-1"
                                            placeholder="0"
                                        />
                                        <span className="text-sm text-muted-foreground w-8">
                                            {selectedUnit === 'CM' ? 'cm' : '"'}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => handleRemoveField(key)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))
                            )}

                            {/* Add New Field */}
                            {showAddField ? (
                                <div className="flex items-center gap-3 pt-2 border-t">
                                    <Input
                                        placeholder="Field name (e.g., Collar)"
                                        value={newFieldName}
                                        onChange={(e) => setNewFieldName(e.target.value)}
                                        className="flex-1"
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddField()}
                                    />
                                    <Button size="sm" onClick={handleAddField}>
                                        Add
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => setShowAddField(false)}>
                                        Cancel
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full mt-2"
                                    onClick={() => setShowAddField(true)}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Field
                                </Button>
                            )}
                        </div>
                    </ScrollArea>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
