'use client';

import { ArrowDown, ArrowRight, Loader2, RefreshCw, Ruler, Scale } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
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
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { fetchApi } from '@/lib/fetch-api';
import { cn } from '@/lib/utils';

interface MeasurementSyncDialogProps {
    clientId: string;
    clientName: string;
    /** Local measurements stored by tailor */
    tailorMeasurements: Record<string, any> | null;
    /** Global measurements from client's profile (can be raw values or structured JSON) */
    clientProfileMeasurements: Record<string, any> | null;
    /** Unit used by the tailor */
    tailorUnit?: string;
    /** Last synced timestamp */
    lastSyncedAt?: string;
    onSyncComplete?: () => void;
}

type SyncStrategy = 'use_client' | 'use_tailor' | 'merge';

interface MergeChoice {
    [key: string]: 'client' | 'tailor';
}

export function MeasurementSyncDialog({
    clientId,
    clientName,
    tailorMeasurements,
    clientProfileMeasurements,
    tailorUnit = 'CM',
    lastSyncedAt,
    onSyncComplete,
}: MeasurementSyncDialogProps) {
    const [open, setOpen] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [strategy, setStrategy] = useState<SyncStrategy>('use_client');
    const [mergeChoices, setMergeChoices] = useState<MergeChoice>({});

    // Handle both old raw values and new structured JSON { values, unit, updatedAt }
    // For tailor measurements - unwrap nested values if present
    const tailorData = tailorMeasurements as any;
    const tailorValues = (tailorData?.values && typeof tailorData.values === 'object' && !Array.isArray(tailorData.values))
        ? tailorData.values
        : (tailorMeasurements || {});

    // Filter out metadata keys from tailor values
    const filteredTailorValues = Object.fromEntries(
        Object.entries(tailorValues).filter(([key]) =>
            !['unit', 'updatedAt', 'createdAt', 'id', 'clientId', 'templateId', 'notes', 'sketch', 'isSynced', 'clientSideId', 'values'].includes(key)
        )
    );

    // Handle both old raw values and new structured JSON { values, unit, updatedAt }
    const clientProfileData = clientProfileMeasurements as any;
    const clientRawValues = (clientProfileData?.values && typeof clientProfileData.values === 'object')
        ? clientProfileData.values
        : (clientProfileMeasurements || {});
    const clientUnit = clientProfileData?.unit || 'CM';

    // Filter out metadata keys from client values
    const clientValues = Object.fromEntries(
        Object.entries(clientRawValues).filter(([key]) =>
            !['unit', 'updatedAt', 'createdAt', 'id', 'clientId', 'templateId', 'notes', 'sketch', 'isSynced', 'clientSideId', 'values'].includes(key)
        )
    ) as Record<string, any>;

    // Get all unique keys from both measurement sets
    const allKeys = Array.from(
        new Set([...Object.keys(filteredTailorValues), ...Object.keys(clientValues)])
    ).filter(key => {
        // Only include keys that have primitive values (numbers or strings)
        const tailorVal = filteredTailorValues[key];
        const clientVal = clientValues[key];
        return (typeof tailorVal === 'number' || typeof tailorVal === 'string' || tailorVal === undefined) &&
            (typeof clientVal === 'number' || typeof clientVal === 'string' || clientVal === undefined);
    }).sort();

    // Find keys with differences
    const diffKeys = allKeys.filter((key) => {
        const tailorVal = filteredTailorValues[key];
        const clientVal = clientValues[key];
        return tailorVal !== clientVal && (tailorVal !== undefined || clientVal !== undefined);
    });

    const hasDifferences = diffKeys.length > 0;
    const hasClientMeasurements = Object.keys(clientValues).length > 0;

    // Initialize merge choices when opening dialog
    const initializeMergeChoices = () => {
        const choices: MergeChoice = {};
        allKeys.forEach((key) => {
            // Default to client value if exists, otherwise tailor
            choices[key] = clientValues[key] !== undefined ? 'client' : 'tailor';
        });
        setMergeChoices(choices);
    };

    const handleOpenChange = (isOpen: boolean) => {
        if (isOpen) {
            initializeMergeChoices();
        }
        setOpen(isOpen);
    };

    const getMergedValues = (): Record<string, any> => {
        if (strategy === 'use_client') return clientValues;
        if (strategy === 'use_tailor') return filteredTailorValues;

        // Custom merge
        const merged: Record<string, any> = {};
        allKeys.forEach((key) => {
            const choice = mergeChoices[key] || 'client';
            merged[key] = choice === 'client' ? clientValues[key] : filteredTailorValues[key];
        });
        return merged;
    };

    const handleSync = async () => {
        try {
            setSyncing(true);
            const mergedValues = getMergedValues();

            // Create a new measurement record with the merged/chosen values
            const res = await fetchApi(`/api/clients/${clientId}/measurements`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    values: mergedValues,
                    unit: strategy === 'use_client' ? clientUnit : tailorUnit,
                    notes: `Synced from profile using "${strategy}" strategy`,
                }),
            });

            if (!res.ok) {
                throw new Error('Failed to sync measurements');
            }

            toast.success('Measurements Synced', {
                description: `Updated measurements for ${clientName}`,
            });

            setOpen(false);
            onSyncComplete?.();
        } catch (error) {
            console.error('Sync error:', error);
            toast.error('Sync Failed', {
                description: 'Could not sync measurements. Please try again.',
            });
        } finally {
            setSyncing(false);
        }
    };

    if (!hasClientMeasurements) {
        return (
            <Button variant="outline" size="sm" disabled>
                <RefreshCw className="h-4 w-4 mr-2" />
                No Profile Data
            </Button>
        );
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="relative">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync from Profile
                    {hasDifferences && (
                        <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-amber-500 text-black text-[10px]">
                            !
                        </Badge>
                    )}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Scale className="h-5 w-5 text-primary" />
                        Sync Measurements
                    </DialogTitle>
                    <DialogDescription>
                        Compare and merge measurements from {clientName}'s global profile with your local
                        records.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Sync Strategy Selection */}
                    <div className="space-y-3">
                        <Label className="text-sm font-semibold">Sync Strategy</Label>
                        <RadioGroup
                            value={strategy}
                            onValueChange={(val) => setStrategy(val as SyncStrategy)}
                            className="grid grid-cols-3 gap-3"
                        >
                            <label
                                className={cn(
                                    'flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors',
                                    strategy === 'use_client'
                                        ? 'border-primary bg-primary/5'
                                        : 'border-muted hover:border-primary/50'
                                )}
                            >
                                <RadioGroupItem value="use_client" className="sr-only" />
                                <ArrowDown className="h-5 w-5 text-primary" />
                                <span className="text-sm font-medium">Use Client's</span>
                                <span className="text-xs text-muted-foreground text-center">
                                    Replace with profile data
                                </span>
                            </label>

                            <label
                                className={cn(
                                    'flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors',
                                    strategy === 'use_tailor'
                                        ? 'border-primary bg-primary/5'
                                        : 'border-muted hover:border-primary/50'
                                )}
                            >
                                <RadioGroupItem value="use_tailor" className="sr-only" />
                                <ArrowRight className="h-5 w-5 rotate-180 text-primary" />
                                <span className="text-sm font-medium">Keep Yours</span>
                                <span className="text-xs text-muted-foreground text-center">
                                    No changes to local
                                </span>
                            </label>

                            <label
                                className={cn(
                                    'flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors',
                                    strategy === 'merge'
                                        ? 'border-primary bg-primary/5'
                                        : 'border-muted hover:border-primary/50'
                                )}
                            >
                                <RadioGroupItem value="merge" className="sr-only" />
                                <RefreshCw className="h-5 w-5 text-primary" />
                                <span className="text-sm font-medium">Merge</span>
                                <span className="text-xs text-muted-foreground text-center">Choose per field</span>
                            </label>
                        </RadioGroup>
                    </div>

                    <Separator />

                    {/* Measurement Comparison */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-semibold">Measurements Comparison</Label>
                            {hasDifferences && (
                                <Badge variant="outline" className="text-amber-600 border-amber-600/50">
                                    {diffKeys.length} difference{diffKeys.length > 1 ? 's' : ''}
                                </Badge>
                            )}
                        </div>

                        <ScrollArea className="h-[280px] rounded-lg border">
                            <div className="p-4 space-y-2">
                                {/* Header */}
                                <div className="grid grid-cols-3 gap-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-2 border-b">
                                    <span>Measurement</span>
                                    <span className="text-center">Your Records ({tailorUnit})</span>
                                    <span className="text-center">Client Profile ({clientUnit})</span>
                                </div>

                                {allKeys.map((key) => {
                                    const tailorVal = tailorValues[key];
                                    const clientVal = clientValues[key];
                                    const isDifferent = tailorVal !== clientVal;
                                    const isMergeMode = strategy === 'merge';

                                    return (
                                        <div
                                            key={key}
                                            className={cn(
                                                'grid grid-cols-3 gap-4 py-2 rounded-md transition-colors',
                                                isDifferent && 'bg-amber-50 dark:bg-amber-950/20'
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Ruler className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-sm font-medium capitalize">
                                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                                </span>
                                            </div>

                                            {/* Tailor Value */}
                                            <button
                                                onClick={() =>
                                                    isMergeMode && setMergeChoices((prev) => ({ ...prev, [key]: 'tailor' }))
                                                }
                                                disabled={!isMergeMode}
                                                className={cn(
                                                    'text-center py-1 px-2 rounded transition-colors',
                                                    isMergeMode && 'cursor-pointer hover:bg-muted',
                                                    isMergeMode &&
                                                    mergeChoices[key] === 'tailor' &&
                                                    'ring-2 ring-primary bg-primary/10'
                                                )}
                                            >
                                                <span className={cn('text-sm', tailorVal === undefined && 'text-muted-foreground')}>
                                                    {tailorVal !== undefined ? String(tailorVal) : '—'}
                                                </span>
                                            </button>

                                            {/* Client Value */}
                                            <button
                                                onClick={() =>
                                                    isMergeMode && setMergeChoices((prev) => ({ ...prev, [key]: 'client' }))
                                                }
                                                disabled={!isMergeMode}
                                                className={cn(
                                                    'text-center py-1 px-2 rounded transition-colors',
                                                    isMergeMode && 'cursor-pointer hover:bg-muted',
                                                    isMergeMode &&
                                                    mergeChoices[key] === 'client' &&
                                                    'ring-2 ring-primary bg-primary/10'
                                                )}
                                            >
                                                <span className={cn('text-sm', clientVal === undefined && 'text-muted-foreground')}>
                                                    {clientVal !== undefined ? String(clientVal) : '—'}
                                                </span>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>

                        {strategy === 'merge' && (
                            <p className="text-xs text-muted-foreground">
                                Click on a value to select it for the final merge. Selected values are highlighted.
                            </p>
                        )}
                    </div>

                    {lastSyncedAt && (
                        <p className="text-xs text-muted-foreground">
                            Last synced: {new Date(lastSyncedAt).toLocaleString()}
                        </p>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSync} disabled={syncing || strategy === 'use_tailor'}>
                        {syncing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {strategy === 'use_tailor' ? 'No Changes Needed' : 'Apply Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
