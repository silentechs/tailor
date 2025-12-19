'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Package, Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
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
import { formatCurrency } from '@/lib/utils';

interface MaterialsListProps {
  orderId: string;
}

export function MaterialsList({ orderId }: MaterialsListProps) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState('');

  // Fetch materials used for this order
  const { data: movements, isLoading } = useQuery({
    queryKey: ['order-materials', orderId],
    queryFn: async () => {
      const res = await fetch(`/api/inventory/movements?orderId=${orderId}&type=ISSUE`);
      if (!res.ok) throw new Error('Failed to fetch materials');
      const data = await res.json();
      return data.data;
    },
  });

  // Fetch available inventory for the add dialog
  const { data: inventory } = useQuery({
    queryKey: ['inventory-list'],
    queryFn: async () => {
      const res = await fetch('/api/inventory');
      if (!res.ok) throw new Error('Failed to load inventory');
      const data = await res.json();
      return data.data;
    },
    enabled: isOpen,
  });

  const addMaterialMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/inventory/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: selectedItemId,
          type: 'ISSUE',
          quantity: Number(quantity),
          orderId,
          reason: 'Used for order',
        }),
      });
      if (!res.ok) throw new Error('Failed to add material');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Material deducted from inventory');
      setIsOpen(false);
      setQuantity('');
      setSelectedItemId('');
      queryClient.invalidateQueries({ queryKey: ['order-materials'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] }); // Update stock levels
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  // Helper to find item name from inventory list if needed, or use joined data
  const selectedItem = inventory?.find((i: any) => i.id === selectedItemId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Package className="h-4 w-4" />
          Materials Used
        </h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 text-xs">
              <Plus className="h-3 w-3 mr-1" />
              Add Material
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Deduct Material from Inventory</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Select Item</Label>
                <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Search inventory..." />
                  </SelectTrigger>
                  <SelectContent>
                    {inventory?.map((item: any) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name} ({Number(item.quantity)} {item.unitOfMeasure} available)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantity to Use ({selectedItem?.unitOfMeasure || 'units'})</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <Button
                className="w-full"
                onClick={() => addMaterialMutation.mutate()}
                disabled={!selectedItemId || !quantity || addMaterialMutation.isPending}
              >
                {addMaterialMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : null}
                Confirm Usage
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          <div className="text-xs text-muted-foreground">Loading materials...</div>
        ) : movements?.length > 0 ? (
          <div className="grid gap-2">
            {movements.map((move: any) => {
              const cost = move.item.unitCost
                ? Number(move.item.unitCost) * Number(move.quantity)
                : 0;
              return (
                <div
                  key={move.id}
                  className="flex justify-between items-center bg-muted/20 p-2 rounded text-sm border"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{move.item.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    {cost > 0 && (
                      <span className="text-muted-foreground mr-2">{formatCurrency(cost)}</span>
                    )}
                    <span className="font-mono font-bold">
                      {Number(move.quantity)} {move.item.unitOfMeasure}
                    </span>
                    <span className="text-muted-foreground">
                      {new Date(move.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground italic bg-muted/10 p-4 rounded text-center border border-dashed">
            No materials linked from inventory yet.
          </div>
        )}
      </div>
    </div>
  );
}
