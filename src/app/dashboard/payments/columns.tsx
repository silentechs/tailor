'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  formatCurrency,
  formatDate,
  PAYMENT_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
} from '@/lib/utils';

export type Payment = {
  id: string;
  paymentNumber: string;
  amount: number;
  method: string;
  status: string;
  paidAt: string;
  orderId: string | null;
  client: {
    id: string;
    name: string;
  };
  order: {
    orderNumber: string;
  } | null;
};

export const columns: ColumnDef<Payment>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'paymentNumber',
    header: 'Payment #',
    cell: ({ row }) => {
      return (
        <div className="font-mono font-medium text-primary">{row.getValue('paymentNumber')}</div>
      );
    },
  },
  {
    id: 'clientName',
    accessorFn: (row) => row.client?.name || 'Unknown',
    header: 'Client',
    cell: ({ row }) => {
      const payment = row.original;
      if (payment.client?.id) {
        return (
          <Link href={`/dashboard/clients/${payment.client.id}`} className="hover:underline">
            {payment.client.name}
          </Link>
        );
      }
      return <span>{payment.client?.name || 'Unknown'}</span>;
    },
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) => {
      return <div className="font-medium">{formatCurrency(row.getValue('amount'))}</div>;
    },
  },
  {
    accessorKey: 'method',
    header: 'Method',
    cell: ({ row }) => {
      const method = row.getValue('method') as string;
      return <span className="capitalize">{method.replace(/_/g, ' ').toLowerCase()}</span>;
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      return (
        <StatusBadge
          status={status}
          colorMap={PAYMENT_STATUS_COLORS}
          labelMap={PAYMENT_STATUS_LABELS}
        />
      );
    },
  },
  {
    accessorKey: 'paidAt',
    header: 'Date',
    cell: ({ row }) => formatDate(row.getValue('paidAt')),
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const payment = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            {payment.orderId && (
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/orders/${payment.orderId}`}>View Order</Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem>Download Receipt</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
