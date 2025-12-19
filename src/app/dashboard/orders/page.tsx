'use client';

import { useQuery } from '@tanstack/react-query';
import { Filter, Layers, Loader2, Plus, Scissors, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ORDER_STATUS_LABELS } from '@/lib/utils';
import { collectionColumns } from './collection-columns';
import { columns, type Order } from './columns';

async function getOrders(status?: string) {
  const params = new URLSearchParams();
  if (status) params.append('status', status);

  const res = await fetch(`/api/orders?${params}`);
  if (!res.ok) {
    throw new Error('Failed to fetch orders');
  }
  const data = await res.json();
  return data.data;
}

async function getCollections() {
  const res = await fetch('/api/order-collections');
  if (!res.ok) {
    // Return empty if endpoint not implemented yet to prevent crash
    if (res.status === 404) return [];
    throw new Error('Failed to fetch collections');
  }
  const data = await res.json();
  return data.data;
}

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState('');

  const {
    data: orders,
    isLoading: isLoadingOrders,
    error: errorOrders,
  } = useQuery({
    queryKey: ['orders', statusFilter],
    queryFn: () => getOrders(statusFilter || undefined),
  });

  const {
    data: collections,
    isLoading: isLoadingCollections,
    error: errorCollections,
  } = useQuery({
    queryKey: ['order-collections'],
    queryFn: getCollections,
  });

  // Transform data to match columns if needed (API structure vs UI structure)
  const formattedOrders: Order[] =
    orders?.map((order: any) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      clientName: order.client?.name || 'Unknown',
      garmentType: order.garmentType.replace(/_/g, ' '),
      status: order.status,
      paymentStatus:
        order.paymentCount > 0
          ? order.paidAmount >= order.totalAmount
            ? 'COMPLETED'
            : 'PARTIAL'
          : 'PENDING',
      amount: Number(order.totalAmount),
      dueDate: order.deadline ? new Date(order.deadline).toLocaleDateString() : 'N/A',
    })) || [];

  const clearFilters = () => {
    setStatusFilter('');
  };

  const hasFilters = !!statusFilter;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading text-primary">Orders Management</h1>
          <p className="text-muted-foreground">Track individual orders and bulk collections.</p>
        </div>
      </div>

      <Tabs defaultValue="individual" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="individual" className="flex items-center gap-2">
              <Scissors className="h-4 w-4" />
              Individual Orders
            </TabsTrigger>
            <TabsTrigger value="bulk" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Bulk Collections
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                  {hasFilters && (
                    <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                      1
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Order Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={statusFilter} onValueChange={setStatusFilter}>
                  <DropdownMenuRadioItem value="">All Statuses</DropdownMenuRadioItem>
                  {Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => (
                    <DropdownMenuRadioItem key={key} value={key}>
                      {label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
                {hasFilters && (
                  <>
                    <DropdownMenuSeparator />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={clearFilters}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear Filters
                    </Button>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button asChild variant="secondary">
              <Link href="/dashboard/orders/bulk-wizard">
                <Layers className="h-4 w-4 mr-2" />
                New Collection
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/orders/new">
                <Plus className="h-4 w-4 mr-2" />
                New Order
              </Link>
            </Button>
          </div>
        </div>

        {hasFilters && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-muted-foreground">Filters:</span>
            {statusFilter && (
              <Badge variant="secondary" className="gap-1">
                {ORDER_STATUS_LABELS[statusFilter as keyof typeof ORDER_STATUS_LABELS]}
                <button onClick={() => setStatusFilter('')}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}

        <TabsContent value="individual" className="space-y-4">
          {isLoadingOrders ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : errorOrders ? (
            <div className="text-center py-8 text-red-500">
              Error loading orders. Please try again.
            </div>
          ) : (
            <DataTable columns={columns} data={formattedOrders} searchKey="clientName" />
          )}
        </TabsContent>

        <TabsContent value="bulk" className="space-y-4">
          {isLoadingCollections ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : errorCollections ? (
            <div className="text-center py-8 text-red-500">Error loading collections.</div>
          ) : (
            <DataTable columns={collectionColumns} data={collections || []} searchKey="name" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
