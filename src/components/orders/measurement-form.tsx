'use client';

import { useQuery } from '@tanstack/react-query';
import { History, Loader2, Mic, Plus, X, AlertCircle, ShieldAlert, Sparkles, ChevronDown, Ruler } from 'lucide-react';
import { useMemo, useState, useRef, useCallback } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { detectMeasurementAnomalies, getMeasurementHint } from '@/lib/ai-logic';
import { offlineDb } from '@/lib/offline-db';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

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
  const { control, setValue } = useFormContext();
  const [customFields, setCustomFields] = useState<string[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const watchedUnit = useWatch({ control, name: 'measurementUnit' }) || 'CM';

  // Voice Dictation State
  const [dictationTarget, setDictationTarget] = useState<string | null>(null);

  // Ref to hold current allFields for the speech callback
  const allFieldsRef = useRef<string[]>([]);

  const watchedValues = useWatch({ control, name: 'measurements' });

  // Handle voice transcription result
  const handleVoiceResult = useCallback(
    (text: string, isFinal: boolean) => {
      if (isFinal) {
        const cleaned = text.toLowerCase().trim();
        const fields = allFieldsRef.current;

        // 1. Batch Parsing (e.g., "Bust 38 and Waist 30")
        const batchMatches = [...cleaned.matchAll(/([a-z\s_]+)\s+(\d+(?:\.\d+)?)/g)];

        if (batchMatches.length > 0) {
          let appliedCount = 0;
          batchMatches.forEach((match) => {
            const spokenField = match[1].trim().replace(/\s+/g, '_');
            const value = match[2];

            const fieldMatch = fields.find(
              (f) =>
                f === spokenField ||
                f.replace(/_/g, ' ') === spokenField.replace(/_/g, ' ') ||
                spokenField.includes(f.replace(/_/g, ' '))
            );

            if (fieldMatch) {
              setValue(`measurements.${fieldMatch}`, value);
              appliedCount++;
            }
          });

          if (appliedCount > 0) {
            toast.success(`Voice Entry: Applied ${appliedCount} values`);
            return;
          }
        }

        // 2. Sequential Dictation Fallback
        const numMatch = cleaned.match(/(\d+(\.\d+)?)/);
        if (numMatch) {
          const value = numMatch[0];

          if (dictationTarget) {
            setValue(`measurements.${dictationTarget}`, value);
            const currentIndex = fields.indexOf(dictationTarget);
            if (currentIndex < fields.length - 1) {
              setDictationTarget(fields[currentIndex + 1]);
            } else {
              setDictationTarget(null);
              toast.success('Dictation complete!');
            }
          } else {
            // Fuzzy match single field entry
            const fieldMatch = fields.find((f) => cleaned.includes(f.replace(/_/g, ' ')));
            if (fieldMatch) {
              setValue(`measurements.${fieldMatch}`, value);
              toast.info(`Set ${fieldMatch.replace(/_/g, ' ')} to ${value}`);
            }
          }
        }
      }
    },
    [dictationTarget, setValue]
  );

  const { isListening, toggleListening } = useSpeechRecognition({
    continuous: true,
    interimResults: true,
    onResult: handleVoiceResult,
  });

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

  const { data: localDraft } = useQuery({
    queryKey: ['local-measurement-draft', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      return await offlineDb.getDraftForClient(clientId);
    },
    enabled: !!clientId,
  });

  const anomalies = useMemo(() => {
    if (!watchedValues || !lastMeasurement) return [];
    return detectMeasurementAnomalies(watchedValues, [lastMeasurement]);
  }, [watchedValues, lastMeasurement]);

  // Find recommended template for current garment type
  const recommendedTemplate = templates?.data?.find((t) => t.garmentType === garmentType);

  // Determine which template to use (selected or recommended)
  const selectedTemplate = useMemo(() => {
    if (!templates?.data) return null;
    if (selectedTemplateId) {
      // Find by ID first, then by garmentType for defaults without ID
      const byId = templates.data.find((t) => t.id === selectedTemplateId);
      if (byId) return byId;
      const byGarment = templates.data.find((t) => t.garmentType === selectedTemplateId);
      if (byGarment) return byGarment;
    }
    return recommendedTemplate;
  }, [templates?.data, selectedTemplateId, recommendedTemplate]);

  const template = selectedTemplate;
  const fields = template ? template.fields : [];

  // Combine template fields, custom fields, and fields from last measurement
  const prevFields = lastMeasurement?.values ? Object.keys(lastMeasurement.values) : [];
  const allFields = [...new Set([...fields, ...customFields, ...prevFields])];

  // Keep the ref updated
  allFieldsRef.current = allFields;

  const loadPrevious = () => {
    if (lastMeasurement?.values) {
      Object.entries(lastMeasurement.values).forEach(([key, value]) => {
        setValue(`measurements.${key}`, value);
      });
    }
  };

  const loadDraft = () => {
    if (localDraft?.values) {
      Object.entries(localDraft.values).forEach(([key, value]) => {
        setValue(`measurements.${key}`, value);
      });
      toast.info('Local draft loaded');
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
    setCustomFields(customFields.filter((f: string) => f !== field));
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
      {/* Template Selector Card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary/5 via-primary/10 to-transparent border border-primary/20 rounded-xl p-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Ruler className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{template?.name || 'Select Template'}</h3>
              <p className="text-xs text-muted-foreground">
                {template ? `${template.fields.length} measurement fields` : 'Choose a measurement template'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Template Selector Dropdown */}
            <Select
              value={selectedTemplateId || template?.id || template?.garmentType || ''}
              onValueChange={(value) => setSelectedTemplateId(value)}
            >
              <SelectTrigger className="min-w-[200px] bg-white/80 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all">
                <SelectValue placeholder="Choose template..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {templates?.data?.map((t) => {
                  const isRecommended = t.garmentType === garmentType;
                  return (
                    <SelectItem key={t.id || t.garmentType} value={t.id || t.garmentType}>
                      <div className="flex items-center gap-2">
                        <span>{t.name}</span>
                        {isRecommended && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                            <Sparkles className="h-3 w-3" />
                            Recommended
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {/* Unit Selector */}
            <FormField
              control={control}
              name="measurementUnit"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || 'CM'}>
                  <SelectTrigger className="w-20 bg-white/80 backdrop-blur-sm border-primary/20">
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CM">CM</SelectItem>
                    <SelectItem value="INCH">INCH</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        {/* Field Preview */}
        {template && (
          <motion.div
            key={template.name}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 pt-3 border-t border-primary/10"
          >
            <div className="flex flex-wrap gap-1.5">
              {template.fields.map((field) => (
                <span
                  key={field}
                  className="text-[10px] bg-white/60 px-2 py-1 rounded-full text-muted-foreground font-medium capitalize border border-primary/10"
                >
                  {field.replace(/_/g, ' ')}
                </span>
              ))}
              {customFields.length > 0 && (
                <>
                  <span className="text-[10px] text-muted-foreground px-1">+</span>
                  {customFields.map((field) => (
                    <span
                      key={field}
                      className="text-[10px] bg-blue-50 px-2 py-1 rounded-full text-blue-600 font-medium capitalize border border-blue-200"
                    >
                      {field.replace(/_/g, ' ')}
                    </span>
                  ))}
                </>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Action Buttons Row */}
      <div className="flex flex-wrap gap-2">
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
        {localDraft
          ? !localDraft.isSynced && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={loadDraft}
              className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
            >
              <History className="h-4 w-4 mr-2" />
              Load Unsaved Draft
            </Button>
          )
          : null}
        <Button
          type="button"
          variant={isListening ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            toggleListening();
            if (!isListening && allFields.length > 0) {
              setDictationTarget(allFields[0]);
              toast.info('Dictation started. Say the values for each field.');
            } else {
              setDictationTarget(null);
            }
          }}
          className={cn(isListening && 'bg-red-500 hover:bg-red-600 animate-pulse')}
        >
          <Mic className="h-4 w-4 mr-2" />
          {isListening ? 'Listening...' : 'Dictate'}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Custom
        </Button>
      </div>

      {anomalies.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3"
        >
          <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold text-amber-800">Fit Guard: Potential measurement anomalies</p>
            <p className="text-amber-700 text-xs mt-1">
              Some values differ significantly from history. Please double-check:
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {anomalies.map((a) => (
                <span
                  key={a.field}
                  className="bg-white/50 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-medium text-amber-800"
                >
                  {a.field.replace(/_/g, ' ')}: {a.newValue}" (was {a.historicalAvg.toFixed(1)}")
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {allFields.map((field) => {
          const isCustom = customFields.includes(field);
          const val = watchedValues?.[field];
          const numVal = parseFloat(String(val));
          const hint = !Number.isNaN(numVal) ? getMeasurementHint(field, numVal) : null;
          const isTarget = dictationTarget === field && isListening;

          return (
            <FormField
              key={field}
              control={control}
              name={`measurements.${field}`}
              render={({ field: inputField }) => (
                <FormItem className="relative">
                  <FormLabel
                    className={cn(
                      'flex items-center justify-between text-xs capitalize text-muted-foreground transition-colors',
                      isTarget && 'text-primary font-bold'
                    )}
                  >
                    <span className="flex items-center gap-1">
                      {field.replace(/_/g, ' ')}
                      {hint && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <AlertCircle className="h-3 w-3 text-amber-500 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{hint}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </span>
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
                    <div
                      className={cn(
                        'relative rounded-md transition-all duration-300',
                        isTarget && 'ring-2 ring-primary ring-offset-2 scale-105 z-10'
                      )}
                    >
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="0.0"
                        {...inputField}
                        className={cn(
                          'text-center font-mono pr-8',
                          isTarget && 'border-primary'
                        )}
                        onFocus={() => isListening && setDictationTarget(field)}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-medium">
                        {watchedUnit}
                      </span>
                    </div>
                  </FormControl>
                  {isTarget && (
                    <div className="absolute -bottom-6 left-0 right-0 text-[10px] text-primary font-bold text-center animate-bounce">
                      Awaiting {field.replace(/_/g, ' ')}...
                    </div>
                  )}
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
          <div className="py-4 space-y-2">
            <Label htmlFor="field-name">Field Name</Label>
            <Input
              id="field-name"
              placeholder="e.g. Neck Size, Thigh"
              value={newFieldName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewFieldName(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddField();
                }
              }}
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
