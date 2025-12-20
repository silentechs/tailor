'use client';

import { useQuery } from '@tanstack/react-query';
import { Filter, Loader2, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { AddInvoiceDialog } from '@/components/invoices/add-invoice-dialog';
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
import { ExportDropdown } from '@/components/ui/export-dropdown';
import { columns } from './columns';

const INVOICE_STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SENT', label: 'Sent' },
  { value: 'VIEWED', label: 'Viewed' },
  { value: 'PAID', label: 'Paid' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function InvoicesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const {
    data: invoicesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['invoices', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('pageSize', '100');
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`/api/invoices?${params}`);
      if (!res.ok) throw new Error('Failed to fetch invoices');
      const data = await res.json();
      return data.data;
    },
  });

  const invoices = invoicesData || [];

  const clearFilters = () => {
    setStatusFilter('');
  };

  const hasFilters = !!statusFilter;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading text-primary">Invoices</h1>
          <p className="text-muted-foreground">Manage billing and financial documents.</p>
        </div>
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
              <DropdownMenuLabel>Invoice Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={statusFilter} onValueChange={setStatusFilter}>
                {INVOICE_STATUSES.map((status) => (
                  <DropdownMenuRadioItem key={status.value} value={status.value}>
                    {status.label}
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
          <ExportDropdown apiEndpoint="/api/invoices/export" filename="invoices" />
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        </div>
      </div>

      {hasFilters && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filters:</span>
          {statusFilter && (
            <Badge variant="secondary" className="gap-1">
              {INVOICE_STATUSES.find((s) => s.value === statusFilter)?.label}
              <button onClick={() => setStatusFilter('')}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      <AddInvoiceDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">
          Error loading invoices. Please try again.
        </div>
      ) : (
        <DataTable columns={columns} data={invoices} searchKey="clientName" />
      )}
    </div>
  );
}
