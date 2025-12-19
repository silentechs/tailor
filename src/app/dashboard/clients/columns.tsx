'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Mail, MapPin, MessageSquare, MoreHorizontal, Phone, Share2 } from 'lucide-react';
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
  email: string;
  phone: string;
  region: string;
  lastOrder: string;
  totalOrders: number;
  status: 'active' | 'inactive';
  trackingToken: string | null;
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
        <span className="font-medium">{row.getValue('name')}</span>
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
    accessorKey: 'totalOrders',
    header: 'Orders',
    cell: ({ row }) => <div className="text-center">{row.getValue('totalOrders')}</div>,
  },
  {
    accessorKey: 'lastOrder',
    header: 'Last Activity',
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
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
