'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowUpRight,
  Edit,
  Filter,
  Loader2,
  MoreVertical,
  Package,
  Plus,
  Search,
  Trash,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { InventoryItemDialog } from '@/components/inventory/add-item-dialog';
import { ReceiptStockDialog } from '@/components/inventory/receipt-stock-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { fetchApi } from '@/lib/fetch-api';
import { cn, formatCurrency } from '@/lib/utils';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

async function getInventory() {
  const res = await fetchApi('/api/inventory');
  if (!res.ok) throw new Error('Failed to fetch inventory');
  const data = await res.json();
  return data.data;
}

async function getMovements() {
  const res = await fetchApi('/api/inventory/movements?limit=10');
  if (!res.ok) throw new Error('Failed to fetch movements');
  const data = await res.json();
  return data.data;
}

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data: items, isLoading: isItemsLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: getInventory,
  });

  const { data: movements, isLoading: isMovementsLoading } = useQuery({
    queryKey: ['inventory-movements'],
    queryFn: getMovements,
  });

  const filteredItems =
    items?.filter(
      (item: any) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const lowStockItems =
    items?.filter((item: any) => Number(item.quantity) <= Number(item.minStock)) || [];

  // ... deleteMutation and handleEdit ...

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchApi(`/api/inventory/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete item');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Item deleted');
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const handleEdit = (item: any) => {
    setItemToEdit(item);
    setIsAddOpen(true);
  };

  if (isItemsLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold font-heading text-primary">Inventory Control</h1>
          <p className="text-muted-foreground mt-2">
            Manage fabric, thread, and workshop supplies.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setIsReceiptOpen(true)}>
            <ArrowUpRight className="h-4 w-4 mr-2" />
            Receipt Stock
          </Button>
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Total Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{items?.length || 0}</div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            'transition-colors',
            lowStockItems.length > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
          )}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase flex items-center gap-2">
              <AlertTriangle
                className={cn(
                  'h-4 w-4',
                  lowStockItems.length > 0 ? 'text-red-500' : 'text-green-500'
                )}
              />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                'text-3xl font-bold',
                lowStockItems.length > 0 ? 'text-red-600' : 'text-green-600'
              )}
            >
              {lowStockItems.length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-orange-500" />
              Recent Movements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {isMovementsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                movements?.length || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Last 10 transactions</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-[350px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search inventory..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter Categories
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[60px]">Image</TableHead>
                <TableHead className="w-[100px]">SKU</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Stock Level</TableHead>
                <TableHead className="text-right">Unit Cost</TableHead>
                <TableHead className="text-right">Alert At</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item: any) => {
                const isLow = Number(item.quantity) <= Number(item.minStock);
                return (
                  <TableRow key={item.id} className="group cursor-pointer hover:bg-muted/30">
                    <TableCell className="w-[60px]">
                      <div className="h-10 w-10 rounded-md bg-muted overflow-hidden flex items-center justify-center">
                        {item.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Package className="h-5 w-5 text-muted-foreground/50" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {item.sku || '---'}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{item.name}</div>
                      {item.description && (
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {item.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {item.category || 'General'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={cn('font-bold text-lg', isLow ? 'text-red-600' : 'text-primary')}
                      >
                        {Number(item.quantity)}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">
                        {item.unitOfMeasure}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {item.unitCost ? formatCurrency(item.unitCost) : '---'}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {item.minStock} {item.unitOfMeasure}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEdit(item)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Item
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => setDeleteConfirmId(item.id)}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete Item
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <ConfirmDialog
                        open={deleteConfirmId === item.id}
                        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
                        title="Delete Inventory Item"
                        description="Are you sure you want to delete this item? This action cannot be undone."
                        confirmText="Delete"
                        variant="destructive"
                        onConfirm={() => {
                          deleteMutation.mutate(item.id);
                          setDeleteConfirmId(null);
                        }}
                        isLoading={deleteMutation.isPending}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No inventory items found. Add your first fabric or accessory.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <InventoryItemDialog
        open={isAddOpen}
        onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) setItemToEdit(null);
        }}
        itemToEdit={itemToEdit}
      />

      <ReceiptStockDialog
        open={isReceiptOpen}
        onOpenChange={setIsReceiptOpen}
        inventoryItems={items || []}
      />
    </div>
  );
}
