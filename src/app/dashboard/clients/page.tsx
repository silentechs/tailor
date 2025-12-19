'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { ExportDropdown } from '@/components/ui/export-dropdown';
import { columns } from './columns';

async function getClients() {
  const res = await fetch('/api/clients');
  if (!res.ok) {
    throw new Error('Failed to fetch clients');
  }
  const data = await res.json();
  return data.data;
}

export default function ClientsPage() {
  const {
    data: clients,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['clients'],
    queryFn: getClients,
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading text-primary">Client Directory</h1>
          <p className="text-muted-foreground">Manage your client base and measurements.</p>
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

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">
          Error loading clients. Please try again.
        </div>
      ) : (
        <DataTable columns={columns} data={clients || []} searchKey="name" />
      )}
    </div>
  );
}
