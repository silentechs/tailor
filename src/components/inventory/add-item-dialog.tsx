'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ImageIcon, Loader2, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { fetchApi } from '@/lib/fetch-api';

const itemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  unitOfMeasure: z.string().optional(),
  quantity: z.string().optional(),
  minStock: z.string().optional(),
  unitCost: z.string().optional(),
});

interface InventoryItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemToEdit?: any;
}

export function InventoryItemDialog({ open, onOpenChange, itemToEdit }: InventoryItemDialogProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(itemToEdit?.imageUrl || null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const form = useForm<z.infer<typeof itemSchema>>({
    resolver: zodResolver(itemSchema),
    values: itemToEdit
      ? {
        name: itemToEdit.name,
        sku: itemToEdit.sku || '',
        category: itemToEdit.category || 'fabric',
        description: itemToEdit.description || '',
        unitOfMeasure: itemToEdit.unitOfMeasure || 'YARDS',
        quantity: String(itemToEdit.quantity || '0'),
        minStock: String(itemToEdit.minStock || '0'),
        unitCost: itemToEdit.unitCost ? String(itemToEdit.unitCost) : '',
      }
      : {
        name: '',
        sku: '',
        category: 'fabric',
        description: '',
        unitOfMeasure: 'YARDS',
        quantity: '0',
        minStock: '0',
        unitCost: '',
      },
  });

  // Reset image when dialog opens with different item
  useState(() => {
    setImageUrl(itemToEdit?.imageUrl || null);
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File is too large. Max 5MB.');
      return;
    }

    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'inventory');

    try {
      const res = await fetchApi('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      const data = await res.json();
      setImageUrl(data.url);
      toast.success('Image uploaded');
    } catch (_error) {
      toast.error('Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      const url = itemToEdit ? `/api/inventory/${itemToEdit.id}` : '/api/inventory';
      const method = itemToEdit ? 'PUT' : 'POST';

      const res = await fetchApi(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(itemToEdit ? 'Failed to update item' : 'Failed to create item');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success(itemToEdit ? 'Item updated' : 'Inventory item added');
      onOpenChange(false);
      form.reset();
      setImageUrl(null);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const onSubmit = (values: z.infer<typeof itemSchema>) => {
    const payload = {
      name: values.name,
      sku: values.sku || null,
      category: values.category || 'other',
      description: values.description || null,
      unitOfMeasure: values.unitOfMeasure || 'YARDS',
      quantity: parseFloat(values.quantity || '0') || 0,
      minStock: parseFloat(values.minStock || '0') || 0,
      unitCost: values.unitCost ? parseFloat(values.unitCost) : null,
      imageUrl: imageUrl,
    };
    mutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{itemToEdit ? 'Edit Inventory Item' : 'Add Inventory Item'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            {/* Image Upload Section */}
            <div className="space-y-2">
              <label htmlFor="inventory-item-photo" className="text-sm font-medium leading-none">
                Item Photo
              </label>
              <div className="flex items-center gap-4">
                <div className="h-24 w-24 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden bg-muted/30">
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl} alt="Item" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    id="inventory-item-photo"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                  >
                    {isUploadingImage ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {isUploadingImage ? 'Uploading...' : 'Upload Image'}
                  </Button>
                  {imageUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => setImageUrl(null)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Optional. Max 5MB, JPG/PNG.</p>
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Blue Kente Cloth, Silk Thread" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional notes about this item..."
                      className="h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="FB-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="fabric">Fabric</SelectItem>
                        <SelectItem value="thread">Thread</SelectItem>
                        <SelectItem value="buttons">Buttons</SelectItem>
                        <SelectItem value="zippers">Zippers</SelectItem>
                        <SelectItem value="accessories">Accessories</SelectItem>
                        <SelectItem value="lining">Lining</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-4 gap-3">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Init Qty</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unitOfMeasure"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="YARDS">Yards</SelectItem>
                        <SelectItem value="METERS">Meters</SelectItem>
                        <SelectItem value="PCS">Pcs/EA</SelectItem>
                        <SelectItem value="ROLLS">Rolls</SelectItem>
                        <SelectItem value="SETS">Sets</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="minStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alert At</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unitCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost (GHS)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {itemToEdit ? 'Update Item' : 'Create Item'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
