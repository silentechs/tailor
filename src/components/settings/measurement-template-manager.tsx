'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Ruler, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchApi } from '@/lib/fetch-api';

async function getTemplates() {
  const res = await fetchApi('/api/measurement-templates');
  if (!res.ok) throw new Error('Failed to fetch templates');
  const data = await res.json();
  return data.data;
}

export function MeasurementTemplateManager() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newFields, setNewFields] = useState<string[]>([]);
  const [fieldInput, setFieldInput] = useState('');

  const { data: templates, isLoading, isError } = useQuery({
    queryKey: ['measurement-templates'],
    queryFn: getTemplates,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetchApi('/api/measurement-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create template');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['measurement-templates'] });
      setIsAdding(false);
      setNewName('');
      setNewFields([]);
      toast.success('Template created successfully');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const addField = () => {
    if (!fieldInput.trim()) return;
    setNewFields([...newFields, fieldInput.trim().toLowerCase().replace(/\s+/g, '_')]);
    setFieldInput('');
  };

  const removeField = (index: number) => {
    setNewFields(newFields.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!newName.trim() || newFields.length === 0) {
      toast.error('Please provide a name and at least one field');
      return;
    }
    createMutation.mutate({
      name: newName,
      garmentType: 'OTHER', // Default for custom templates
      fields: newFields,
    });
  };

  if (isLoading) return <Loader2 className="h-8 w-8 animate-spin mx-auto my-12" />;

  // Ensure templates is always an array
  const templateList = Array.isArray(templates) ? templates : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Measurement Templates</CardTitle>
            <CardDescription>
              Define custom sets of measurements for different garments.
            </CardDescription>
          </div>
          {!isAdding && (
            <Button onClick={() => setIsAdding(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" /> New Template
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isAdding && (
            <div className="mb-8 p-4 border rounded-xl bg-muted/30 space-y-4 animate-in slide-in-from-top-2 duration-300">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Template Name</Label>
                  <Input
                    placeholder="e.g. Slim Fit Shirt"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Add Field</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. Chest Width"
                      value={fieldInput}
                      onChange={(e) => setFieldInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addField()}
                    />
                    <Button type="button" variant="outline" onClick={addField}>
                      Add
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {newFields.map((field, i) => (
                  <Badge
                    key={field}
                    variant="secondary"
                    className="pl-2 pr-1 py-1 flex items-center gap-1"
                  >
                    {field}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 rounded-full p-0"
                      onClick={() => removeField(i)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="ghost" onClick={() => setIsAdding(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={createMutation.isPending}>
                  Save Template
                </Button>
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isError && (
              <p className="text-sm text-muted-foreground col-span-full">
                Unable to load templates. Please try again.
              </p>
            )}
            {templateList.map((template: any) => (
              <div
                key={template.id || template.name}
                className="p-4 border rounded-xl hover:border-primary/50 transition-colors group relative"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      <Ruler className="h-4 w-4" />
                    </div>
                    <h4 className="font-bold">{template.name}</h4>
                  </div>
                  {!template.id && (
                    <Badge variant="outline" className="text-[8px] uppercase">
                      Default
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 mt-3">
                  {template.fields.slice(0, 5).map((f: string) => (
                    <span
                      key={f}
                      className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground uppercase font-mono"
                    >
                      {f.replace(/_/g, ' ')}
                    </span>
                  ))}
                  {template.fields.length > 5 && (
                    <span className="text-[10px] text-muted-foreground">
                      +{template.fields.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
