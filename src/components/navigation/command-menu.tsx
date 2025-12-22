'use client';

import { Command } from 'cmdk';
import {
  BarChart,
  Bell,
  FileText,
  Globe,
  Layers,
  MessageSquare,
  Plus,
  Scissors,
  Search,
  Settings,
  User,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VoiceInput } from '@/components/ui/voice-input';
import { cn } from '@/lib/utils';

export function CommandMenu() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'relative inline-flex items-center justify-start rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-muted/50 hover:bg-muted h-10 w-10 md:w-full md:max-w-md md:px-4 group'
        )}
      >
        <Search className="h-4 w-4 md:mr-2 text-muted-foreground group-hover:text-primary transition-colors mx-auto md:mx-0" />
        <span className="hidden md:inline text-muted-foreground">Search anything...</span>
        <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden lg:flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0 shadow-lg max-w-2xl border-none">
          <DialogTitle className="sr-only">Search Command Menu</DialogTitle>
          <Command className="flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground">
            <div className="flex items-center border-b px-4 py-3" cmdk-input-wrapper="">
              <Search className="mr-2 h-5 w-5 shrink-0 text-muted-foreground" />
              <Command.Input
                placeholder="Type a command or search..."
                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
              <VoiceInput
                onTranscript={(text) => {
                  // We need to find a way to set the value of Command.Input
                  // cmdk doesn't make this easy with controlled components sometimes
                  // But usually, we can dispatch an input event
                  const input = document.querySelector('[cmdk-input]') as HTMLInputElement;
                  if (input) {
                    input.value = text;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                  }
                }}
                className="ml-2"
              />
            </div>
            <Command.List className="max-h-[450px] overflow-y-auto overflow-x-hidden p-2">
              <Command.Empty className="py-14 text-center text-sm">
                <div className="flex flex-col items-center gap-2">
                  <Search className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-muted-foreground">No results found.</p>
                </div>
              </Command.Empty>

              <Command.Group
                heading="Quick Actions"
                className="px-2 py-3 overflow-hidden text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-black [&_[cmdk-group-heading]]:text-muted-foreground/50 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest"
              >
                <CommandItem
                  onSelect={() => runCommand(() => router.push('/dashboard/orders/new'))}
                >
                  <Plus className="mr-2 h-4 w-4 text-primary" />
                  <span>Create New Order</span>
                </CommandItem>
                <CommandItem
                  onSelect={() => runCommand(() => router.push('/dashboard/clients/new'))}
                >
                  <Plus className="mr-2 h-4 w-4 text-primary" />
                  <span>Add New Client</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/messages'))}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  <span>Send Message</span>
                </CommandItem>
              </Command.Group>

              <Command.Separator className="-mx-2 h-px bg-border" />

              <Command.Group
                heading="Navigation"
                className="px-2 py-3 overflow-hidden text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-black [&_[cmdk-group-heading]]:text-muted-foreground/50 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest"
              >
                <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/business'))}>
                  <Globe className="mr-2 h-4 w-4" />
                  <span>Business Overview</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/analytics'))}>
                  <BarChart className="mr-2 h-4 w-4" />
                  <span>Analytics</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/clients'))}>
                  <Users className="mr-2 h-4 w-4" />
                  <span>Clients</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/orders'))}>
                  <FileText className="mr-2 h-4 w-4" />
                  <span>Orders</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/workshop'))}>
                  <Scissors className="mr-2 h-4 w-4" />
                  <span>Workshop</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/inventory'))}>
                  <Layers className="mr-2 h-4 w-4" />
                  <span>Inventory</span>
                </CommandItem>
              </Command.Group>

              <Command.Separator className="-mx-2 h-px bg-border" />

              <Command.Group
                heading="Settings"
                className="px-2 py-3 overflow-hidden text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-black [&_[cmdk-group-heading]]:text-muted-foreground/50 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest"
              >
                <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/settings'))}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile Settings</span>
                </CommandItem>
                <CommandItem
                  onSelect={() => runCommand(() => router.push('/dashboard/notifications'))}
                >
                  <Bell className="mr-2 h-4 w-4" />
                  <span>Notifications</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/settings'))}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>System Settings</span>
                </CommandItem>
              </Command.Group>
            </Command.List>

            <div className="flex items-center justify-between border-t px-4 py-2 bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <kbd className="rounded bg-background px-1.5 py-0.5 border shadow-sm">↑↓</kbd>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <kbd className="rounded bg-background px-1.5 py-0.5 border shadow-sm">↵</kbd>
                  <span>Select</span>
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground">
                <kbd className="rounded bg-background px-1.5 py-0.5 border shadow-sm font-mono text-xs">
                  esc
                </kbd>
                <span className="ml-1">Close</span>
              </div>
            </div>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CommandItem({
  children,
  onSelect,
  className,
}: {
  children: React.ReactNode;
  onSelect?: () => void;
  className?: string;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className={cn(
        'relative flex cursor-default select-none items-center rounded-sm px-3 py-3 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 transition-colors duration-200',
        className
      )}
    >
      {children}
    </Command.Item>
  );
}
