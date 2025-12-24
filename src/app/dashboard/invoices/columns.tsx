'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Download, Eye, MoreHorizontal, Send } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusBadge } from '@/components/ui/status-badge';
import { downloadInvoicePDF } from '@/lib/pdf-generator';
import {
  formatCurrency,
  formatDate,
  INVOICE_STATUS_COLORS,
  INVOICE_STATUS_LABELS,
} from '@/lib/utils';

export type Invoice = {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  paidAmount: number;
  subtotal: number;
  vatAmount: number;
  nhilAmount: number;
  getfundAmount: number;
  status: string;
  createdAt: string;
  dueDate: string;
  notes?: string;
  items?: any[];
  client: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
  };
  order: {
    orderNumber: string;
  } | null;
  tailor?: {
    name: string;
    businessName?: string;
    phone?: string;
    email?: string;
  };
};

export const columns: ColumnDef<Invoice>[] = [
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
    accessorKey: 'invoiceNumber',
    header: 'Invoice #',
    cell: ({ row }) => (
      <Link
        href={`/dashboard/invoices/${row.original.id}`}
        className="font-mono font-medium text-primary hover:underline"
      >
        {row.getValue('invoiceNumber')}
      </Link>
    ),
  },
  {
    id: 'clientName',
    accessorFn: (row) => row.client?.name || 'Unknown',
    header: 'Client',
    cell: ({ row }) => (
      <Link href={`/dashboard/clients/${row.original.client?.id}`} className="hover:underline">
        {row.original.client?.name || 'Unknown'}
      </Link>
    ),
  },
  {
    accessorKey: 'totalAmount',
    header: 'Amount',
    cell: ({ row }) => {
      return <div className="font-medium">{formatCurrency(row.getValue('totalAmount'))}</div>;
    },
  },
  {
    accessorKey: 'balance',
    header: 'Balance',
    cell: ({ row }) => {
      const balance = row.original.totalAmount - row.original.paidAmount;
      return (
        <div className={balance > 0 ? 'text-destructive font-medium' : 'text-muted-foreground'}>
          {formatCurrency(balance)}
        </div>
      );
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
          colorMap={INVOICE_STATUS_COLORS}
          labelMap={INVOICE_STATUS_LABELS}
        />
      );
    },
  },
  {
    accessorKey: 'dueDate',
    header: 'Due Date',
    cell: ({ row }) => {
      const date = row.getValue('dueDate') as string;
      if (!date) return <span className="text-muted-foreground">N/A</span>;

      const isOverdue = new Date(date) < new Date() && row.original.status !== 'PAID';
      return (
        <span className={isOverdue ? 'text-destructive font-medium' : ''}>{formatDate(date)}</span>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const invoice = row.original;

      const handleDownloadPDF = async () => {
        await downloadInvoicePDF({
          invoiceNumber: invoice.invoiceNumber,
          createdAt: invoice.createdAt,
          dueDate: invoice.dueDate,
          status: invoice.status,
          businessName: invoice.tailor?.businessName || invoice.tailor?.name || 'StitchCraft Ghana',
          businessPhone: invoice.tailor?.phone,
          businessEmail: invoice.tailor?.email,
          clientName: invoice.client?.name,
          clientPhone: invoice.client?.phone,
          clientEmail: invoice.client?.email,
          items: invoice.items || [],
          subtotal: Number(invoice.subtotal),
          vatAmount: Number(invoice.vatAmount),
          nhilAmount: Number(invoice.nhilAmount),
          getfundAmount: Number(invoice.getfundAmount),
          totalAmount: Number(invoice.totalAmount),
          paidAmount: Number(invoice.paidAmount),
          notes: invoice.notes,
          orderNumber: invoice.order?.orderNumber,
        });
        toast.success('Invoice PDF downloaded');
      };

      const handleSendToClient = async () => {
        toast.info('Sending invoice to client...');
        // This would integrate with SMS/email service
        toast.success('Invoice send functionality coming soon!');
      };

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
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/invoices/${invoice.id}`}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSendToClient}>
              <Send className="h-4 w-4 mr-2" />
              Send to Client
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
