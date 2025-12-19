'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDate } from '@/lib/utils';

export type OrderCollection = {
  id: string;
  name: string;
  description: string;
  totalOrders: number;
  completedOrders: number;
  deadline: string;
  createdAt: string;
};

export const collectionColumns: ColumnDef<OrderCollection>[] = [
  {
    accessorKey: 'name',
    header: 'Collection Name',
    cell: ({ row }) => <div className="font-medium text-primary">{row.getValue('name')}</div>,
  },
  {
    accessorKey: 'totalOrders',
    header: 'Total Orders',
    cell: ({ row }) => <div className="font-mono">{row.getValue('totalOrders')}</div>,
  },
  {
    accessorKey: 'progress',
    header: 'Progress',
    cell: ({ row }) => {
      const total = row.original.totalOrders;
      const completed = row.original.completedOrders;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      return (
        <div className="w-full max-w-[100px]">
          <div className="text-xs mb-1 flex justify-between">
            <span>{percentage}%</span>
            <span className="text-muted-foreground">
              {completed}/{total}
            </span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${percentage}%` }} />
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'deadline',
    header: 'Deadline',
    cell: ({ row }) => {
      return row.original.deadline ? formatDate(row.original.deadline) : 'N/A';
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => {
      return formatDate(row.original.createdAt);
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
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
            <DropdownMenuItem>View Details</DropdownMenuItem>
            <DropdownMenuItem>Edit Collection</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
