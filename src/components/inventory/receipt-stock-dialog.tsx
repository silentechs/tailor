'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Trash } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ReceiptStockDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    inventoryItems: any[];
}

export function ReceiptStockDialog({ open, onOpenChange, inventoryItems }: ReceiptStockDialogProps) {
    const queryClient = useQueryClient();
    const [rows, setRows] = useState([{ itemId: '', quantity: 1, supplier: '' }]);

    const mutation = useMutation({
        mutationFn: async (items: any[]) => {
            const res = await fetch('/api/inventory/receipt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items }),
            });
            if (!res.ok) throw new Error('Failed to receipt stock');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
            toast.success('Stock received and inventory updated');
            onOpenChange(false);
            setRows([{ itemId: '', quantity: 1, supplier: '' }]);
        },
        onError: (err: any) => {
            toast.error(err.message);
        }
    });

    const addRow = () => setRows([...rows, { itemId: '', quantity: 1, supplier: '' }]);
    const removeRow = (index: number) => setRows(rows.filter((_, i) => i !== index));
    const updateRow = (index: number, field: string, value: any) => {
        const newRows = [...rows];
        newRows[index] = { ...newRows[index], [field]: value };
        setRows(newRows);
    };

    const handleSave = () => {
        const validItems = rows.filter(r => r.itemId && r.quantity > 0);
        if (validItems.length === 0) {
            toast.error('Please add at least one valid item');
            return;
        }
        mutation.mutate(validItems);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Stock Receipt (Bulk Add)</DialogTitle>
                    <DialogDescription>
                        Receive new stock for existing inventory items. This will create movement logs.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-12 gap-2 text-xs font-bold uppercase text-muted-foreground px-1">
                        <div className="col-span-6">Item Name</div>
                        <div className="col-span-2 text-center">Qty</div>
                        <div className="col-span-3">Supplier (Opt)</div>
                        <div className="col-span-1"></div>
                    </div>

                    {rows.map((row, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-6">
                                <Select
                                    value={row.itemId}
                                    onValueChange={(val) => updateRow(index, 'itemId', val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Item" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {inventoryItems.map(item => (
                                            <SelectItem key={item.id} value={item.id}>
                                                {item.name} ({item.unitOfMeasure})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="col-span-2">
                                <Input
                                    type="number"
                                    value={row.quantity}
                                    onChange={(e) => updateRow(index, 'quantity', parseFloat(e.target.value))}
                                />
                            </div>
                            <div className="col-span-3">
                                <Input
                                    placeholder="Source"
                                    value={row.supplier}
                                    onChange={(e) => updateRow(index, 'supplier', e.target.value)}
                                />
                            </div>
                            <div className="col-span-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeRow(index)}
                                    disabled={rows.length === 1}
                                >
                                    <Trash className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </div>
                        </div>
                    ))}

                    <Button variant="outline" size="sm" onClick={addRow} className="w-full border-dashed">
                        <Plus className="h-4 w-4 mr-2" /> Add Another Item
                    </Button>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={mutation.isPending}>
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Process Receipt
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
