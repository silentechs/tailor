'use client';

import { useQuery } from '@tanstack/react-query';
import { Filter, Loader2, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { AddPaymentDialog } from '@/components/payments/add-payment-dialog';
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

const PAYMENT_METHODS = [
  { value: '', label: 'All Methods' },
  { value: 'CASH', label: 'Cash' },
  { value: 'MOBILE_MONEY_MTN', label: 'MTN MoMo' },
  { value: 'MOBILE_MONEY_VODAFONE', label: 'Vodafone Cash' },
  { value: 'MOBILE_MONEY_AIRTELTIGO', label: 'AirtelTigo Money' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
];

export default function PaymentsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [methodFilter, setMethodFilter] = useState('');

  const {
    data: paymentsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['payments', methodFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('pageSize', '100');
      if (methodFilter) params.append('method', methodFilter);

      const res = await fetch(`/api/payments?${params}`);
      if (!res.ok) throw new Error('Failed to fetch payments');
      const data = await res.json();
      return data.data;
    },
  });

  const payments = paymentsData || [];

  const clearFilters = () => {
    setMethodFilter('');
  };

  const hasFilters = !!methodFilter;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading text-primary">Payments</h1>
          <p className="text-muted-foreground">Track all incoming payments and transactions.</p>
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
              <DropdownMenuLabel>Payment Method</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={methodFilter} onValueChange={setMethodFilter}>
                {PAYMENT_METHODS.map((method) => (
                  <DropdownMenuRadioItem key={method.value} value={method.value}>
                    {method.label}
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
          <ExportDropdown apiEndpoint="/api/payments/export" filename="payments" />
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        </div>
      </div>

      {hasFilters && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filters:</span>
          {methodFilter && (
            <Badge variant="secondary" className="gap-1">
              {PAYMENT_METHODS.find((m) => m.value === methodFilter)?.label}
              <button onClick={() => setMethodFilter('')}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      <AddPaymentDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">
          Error loading payments. Please try again.
        </div>
      ) : (
        <DataTable columns={columns} data={payments} searchKey="paymentNumber" />
      )}
    </div>
  );
}
