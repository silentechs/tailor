'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Archive, Mail, MapPin, MessageSquare, MoreHorizontal, Phone, RotateCcw, Share2, Trash2 } from 'lucide-react';
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
import { formatPhoneDisplay } from '@/lib/utils';

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Client = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  region: string | null;
  orderCount: number;
  paymentCount: number;
  trackingToken: string | null;
  isLead: boolean;
  isArchived?: boolean;
  createdAt: string;
};

export const columns: ColumnDef<Client>[] = [
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
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => (
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="font-medium">{row.getValue('name')}</span>
          {row.original.isLead && (
            <span className="text-[10px] bg-ghana-gold text-black font-black px-1.5 py-0.5 rounded-full uppercase">
              Lead
            </span>
          )}
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'contact',
    header: 'Contact',
    cell: ({ row }) => {
      const phone = row.original.phone;
      const email = row.original.email;
      return (
        <div className="flex flex-col text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Phone className="h-3 w-3" />
            {formatPhoneDisplay(phone)}
          </div>
          <div className="flex items-center gap-1">
            <Mail className="h-3 w-3" />
            {email}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'region',
    header: 'Region',
    cell: ({ row }) => (
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <MapPin className="h-3 w-3" />
        {row.getValue('region')}
      </div>
    ),
  },
  {
    accessorKey: 'orderCount',
    header: 'Orders',
    cell: ({ row }) => <div className="text-center">{row.getValue('orderCount')}</div>,
  },
  {
    accessorKey: 'createdAt',
    header: 'Joined',
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {new Date(row.getValue('createdAt')).toLocaleDateString()}
      </div>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const client = row.original;

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
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(client.phone)}>
              Copy Phone
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={async () => {
                const res = await fetch(`/api/clients/${client.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ isLead: !client.isLead }),
                });
                if (res.ok) {
                  toast.success(client.isLead ? 'Removed from leads' : 'Marked as lead');
                  // Since we are in a column def, we might need a better way to refresh data
                  // but standard DataTable usually relies on external query state.
                  // For now, the user has to refresh or wait for cache invalidation.
                  window.location.reload();
                }
              }}
            >
              {client.isLead ? 'Remove Lead Status' : 'Mark as Lead'}
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/clients/${client.id}`}>View Details</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/orders/new?clientId=${client.id}`}>Create Order</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {client.trackingToken && (
              <>
                <DropdownMenuItem
                  onClick={() => {
                    const url = `${window.location.origin}/track/${client.trackingToken}`;
                    navigator.clipboard.writeText(url);
                    toast.success('Tracking link copied!');
                  }}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Copy Tracking Link
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    const url = `${window.location.origin}/track/${client.trackingToken}`;
                    const text = `Akwaaba! Track your order with ${client.name} here: ${url}`;
                    window.open(
                      `https://wa.me/${client.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`,
                      '_blank'
                    );
                  }}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Share on WhatsApp
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                const res = await fetch(`/api/clients/${client.id}`, {
                  method: client.isArchived ? 'PUT' : 'DELETE',
                  headers: { 'Content-Type': 'application/json' },
                  body: client.isArchived ? JSON.stringify({ isArchived: false }) : undefined,
                });
                if (res.ok) {
                  const data = await res.json();
                  toast.success(data.archived ? 'Client archived' : client.isArchived ? 'Client restored' : 'Client deleted');
                  window.location.reload();
                } else {
                  toast.error('Action failed');
                }
              }}
              className={client.isArchived ? '' : 'text-destructive focus:text-destructive'}
            >
              {client.isArchived ? (
                <>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restore Client
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete / Archive
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
