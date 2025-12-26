'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Check, MoreVertical, Search, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function UserModerationPage() {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User status updated');
    },
    onError: () => {
      toast.error('Failed to update status');
    },
  });

  const handleAction = (id: string, newStatus: string) => {
    updateStatusMutation.mutate({ id, status: newStatus });
  };

  const users = usersData?.data || [];

  return (
    <div className="space-y-10">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-4xl font-black font-heading text-slate-900 tracking-tight">
            Tailor <span className="text-primary italic">Moderation</span>
          </h1>
          <p className="text-slate-500 font-medium text-sm sm:text-base">
            Approve and verify fashion entrepreneurs on the platform.
          </p>
        </div>
        <div className="relative group w-full xl:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search by name or email..."
            className="pl-12 h-14 bg-white shadow-sm border-slate-100 focus:border-primary/50 transition-all rounded-2xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-50 hover:bg-transparent px-8">
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-6 sm:pl-10 h-16">
                  Profile
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-16">
                  Business Information
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-16">
                  Status
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-16">
                  Joined
                </TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-slate-400 pr-6 sm:pr-10 h-16">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user: any, idx: number) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="border-slate-50 hover:bg-slate-50/50 transition-colors group px-10"
                  >
                    <TableCell className="py-6 pl-6 sm:pl-10">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                          <AvatarFallback className="bg-slate-100 text-slate-400 font-bold">
                            {user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-slate-900 text-sm whitespace-nowrap">
                            {user.name}
                          </p>
                          <p className="text-xs text-slate-400 font-medium">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-bold text-slate-700 text-sm">
                          {user.businessName || 'No Business Name'}
                        </p>
                        <Badge
                          variant="secondary"
                          className="bg-slate-100 text-slate-500 font-bold text-[9px] uppercase tracking-tighter"
                        >
                          {user.region ? user.region.replace(/_/g, ' ') : 'N/A'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          'text-[10px] font-black uppercase shadow-sm border-none px-3 py-1',
                          user.status === 'ACTIVE' || user.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-600'
                            : user.status === 'PENDING'
                              ? 'bg-amber-50 text-amber-600'
                              : 'bg-red-50 text-red-600'
                        )}
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-bold text-slate-400 tracking-tight">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right pr-6 sm:pr-10">
                      <div className="flex items-center justify-end gap-2">
                        {user.status === 'PENDING' && (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                              disabled={updateStatusMutation.isPending}
                              onClick={() => handleAction(user.id, 'APPROVED')}
                            >
                              <Check className="h-5 w-5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-10 w-10 rounded-full bg-red-50 text-red-600 hover:bg-red-100"
                              disabled={updateStatusMutation.isPending}
                              onClick={() => handleAction(user.id, 'REJECTED')}
                            >
                              <X className="h-5 w-5" />
                            </Button>
                          </>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 rounded-full text-slate-400 hover:text-slate-900"
                            >
                              <MoreVertical className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-48 rounded-2xl p-2 shadow-2xl border-slate-100"
                          >
                            <DropdownMenuItem className="rounded-xl font-bold text-slate-700 h-10 cursor-pointer">
                              View Portfolio
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-xl font-bold text-slate-700 h-10 cursor-pointer">
                              Verification Docs
                            </DropdownMenuItem>
                            <div className="h-[1px] bg-slate-100 my-1" />
                            <DropdownMenuItem
                              className="rounded-xl font-bold text-red-600 h-10 cursor-pointer focus:bg-red-50 focus:text-red-700"
                              onClick={() => handleAction(user.id, 'SUSPENDED')}
                            >
                              Suspend Account
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

// Inline Card component since we don't want to import it for brevity in this single file demo
function Card({ children, className, ...props }: any) {
  return (
    <div className={cn('bg-white border border-slate-100', className)} {...props}>
      {children}
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
