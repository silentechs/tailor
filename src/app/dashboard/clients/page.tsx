'use client';

import { useQuery } from '@tanstack/react-query';
import { HelpCircle, Loader2, UserPlus } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { ExportDropdown } from '@/components/ui/export-dropdown';
import { columns } from './columns';

const PAGINATION_STATE_DEFAULT = {
  pageIndex: 0,
  pageSize: 10,
};

async function getClients({ pageIndex, pageSize }: { pageIndex: number; pageSize: number }) {
  const params = new URLSearchParams({
    page: (pageIndex + 1).toString(),
    pageSize: pageSize.toString(),
  });
  const res = await fetch(`/api/clients?${params.toString()}`);
  if (!res.ok) {
    throw new Error('Failed to fetch clients');
  }
  return res.json();
}

export default function ClientsPage() {
  const [pagination, setPagination] = React.useState(PAGINATION_STATE_DEFAULT);

  const {
    data: response,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['clients', pagination],
    queryFn: () => getClients(pagination),
    placeholderData: (previousData) => previousData, // Keep previous data while fetching
  });

  const clients = response?.data || [];
  const pageCount = response?.pagination?.totalPages || -1;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold font-heading text-primary">Client Directory</h1>
            <p className="text-muted-foreground">Manage your client base and measurements.</p>
          </div>
          <Link
            href="/dashboard/help/clients"
            className="p-2 rounded-full bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
            title="View Clients Help Guide"
          >
            <HelpCircle className="h-5 w-5" />
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <ExportDropdown apiEndpoint="/api/clients/export" filename="clients" />
          <Button asChild>
            <Link href="/dashboard/clients/new">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Client
            </Link>
          </Button>
        </div>
      </div>

      {isLoading && !response ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">
          Error loading clients. Please try again.
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={clients}
          searchKey="name"
          pagination={pagination}
          pageCount={pageCount}
          onPaginationChange={setPagination}
        />
      )}
    </div>
  );
}
