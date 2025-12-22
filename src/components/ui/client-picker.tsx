'use client';

import { Command } from 'cmdk';
import { Check, ChevronsUpDown, Loader2, Search, User, Clock } from 'lucide-react';
import * as React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  _count?: {
    orders?: number;
  };
}

interface ClientPickerProps {
  clients: Client[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function ClientPicker({
  clients,
  value,
  onValueChange,
  placeholder = 'Select a client...',
  isLoading = false,
  disabled = false,
  className,
}: ClientPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const selectedClient = clients.find((c) => c.id === value);

  // Sort clients: those with recent orders first, then alphabetically
  const sortedClients = React.useMemo(() => {
    return [...clients].sort((a, b) => {
      const aOrders = a._count?.orders || 0;
      const bOrders = b._count?.orders || 0;
      if (bOrders !== aOrders) return bOrders - aOrders;
      return a.name.localeCompare(b.name);
    });
  }, [clients]);

  // Filter by search
  const filteredClients = React.useMemo(() => {
    if (!search.trim()) return sortedClients;
    const term = search.toLowerCase();
    return sortedClients.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.phone?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term)
    );
  }, [sortedClients, search]);

  // Group: recent (with orders) vs all
  const recentClients = filteredClients.filter((c) => (c._count?.orders || 0) > 0).slice(0, 5);
  const otherClients = filteredClients.filter((c) => !recentClients.includes(c));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || isLoading}
          className={cn(
            'w-full justify-between font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </span>
          ) : selectedClient ? (
            <span className="flex items-center gap-2 truncate">
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-[10px]">
                  {selectedClient.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{selectedClient.name}</span>
              {selectedClient.phone && (
                <span className="text-muted-foreground text-xs hidden sm:inline">
                  • {selectedClient.phone}
                </span>
              )}
            </span>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command className="max-h-[300px]" shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              placeholder="Search by name, phone, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <Command.List className="max-h-[250px] overflow-y-auto p-1">
            {filteredClients.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {search ? 'No clients found.' : 'No clients available.'}
              </div>
            ) : (
              <>
                {recentClients.length > 0 && !search && (
                  <Command.Group>
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Recent
                    </div>
                    {recentClients.map((client) => (
                      <ClientItem
                        key={client.id}
                        client={client}
                        isSelected={value === client.id}
                        onSelect={() => {
                          onValueChange(client.id);
                          setOpen(false);
                          setSearch('');
                        }}
                      />
                    ))}
                  </Command.Group>
                )}
                {otherClients.length > 0 && (
                  <Command.Group>
                    {!search && recentClients.length > 0 && (
                      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" />
                        All Clients
                      </div>
                    )}
                    {otherClients.map((client) => (
                      <ClientItem
                        key={client.id}
                        client={client}
                        isSelected={value === client.id}
                        onSelect={() => {
                          onValueChange(client.id);
                          setOpen(false);
                          setSearch('');
                        }}
                      />
                    ))}
                  </Command.Group>
                )}
                {search && filteredClients.length > 0 && (
                  <>
                    {filteredClients.map((client) => (
                      <ClientItem
                        key={client.id}
                        client={client}
                        isSelected={value === client.id}
                        onSelect={() => {
                          onValueChange(client.id);
                          setOpen(false);
                          setSearch('');
                        }}
                      />
                    ))}
                  </>
                )}
              </>
            )}
          </Command.List>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function ClientItem({
  client,
  isSelected,
  onSelect,
}: {
  client: Client;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      value={client.id}
      onSelect={onSelect}
      className={cn(
        'flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        'aria-selected:bg-accent aria-selected:text-accent-foreground',
        isSelected && 'bg-primary/10'
      )}
    >
      <Avatar className="h-7 w-7">
        <AvatarFallback className="text-xs bg-primary/10 text-primary">
          {client.name.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{client.name}</p>
        {client.phone && (
          <p className="text-xs text-muted-foreground truncate">{client.phone}</p>
        )}
      </div>
      {(client._count?.orders || 0) > 0 && (
        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
          {client._count?.orders} order{(client._count?.orders || 0) > 1 ? 's' : ''}
        </span>
      )}
      {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
    </Command.Item>
  );
}

