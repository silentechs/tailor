'use client';

import {
  Wallet,
  Search,
  Filter,
  MoreVertical,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Building,
  Calendar,
  Lock,
  History
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const STATUS_CONFIG = {
  COMPLETED: { label: 'Settled', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CreditCard },
  PENDING: { label: 'Pending', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: History },
  FAILED: { label: 'Failed', color: 'bg-red-100 text-red-700 border-red-200', icon: Lock },
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        status,
        page: page.toString(),
        pageSize: '10'
      });
      const res = await fetch(`/api/admin/payments?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setPayments(json.data);
        setPagination(json.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, status]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPayments();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-black font-heading text-slate-900 tracking-tight">
            Financial <span className="text-primary italic">Ledger</span>
          </h1>
          <p className="text-slate-500 font-medium">
            Monitor all transactions and workshop payouts across the platform.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
          <Badge variant="outline" className="rounded-xl px-4 py-1.5 font-bold border-slate-200 text-slate-600">
            Total Volume: GH₵ {(pagination?.totalVolume || 0).toLocaleString()}
          </Badge>
        </div>
      </div>

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="p-8 border-b border-slate-50">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <form onSubmit={handleSearch} className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search transaction IDs, order numbers or business names..."
                className="pl-12 h-14 bg-slate-50 border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-primary/20 transition-all font-medium"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>

            <div className="flex items-center gap-3">
              <select
                className="h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold text-slate-600 focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer min-w-[160px]"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Statuses</option>
                <option value="COMPLETED">Settled</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
              </select>
              <Button
                variant="outline"
                className="h-14 w-14 rounded-2xl border-slate-100 hover:bg-slate-50"
                onClick={fetchPayments}
              >
                <Filter className="h-5 w-5 text-slate-400" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-slate-50 hover:bg-transparent h-14">
                <TableHead className="pl-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Transaction Info</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Origin / Business</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Amount</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date</TableHead>
                <TableHead className="text-right pr-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <TableRow key={i} className="animate-pulse border-slate-50">
                    <TableCell colSpan={6} className="h-20 bg-white/50" />
                  </TableRow>
                ))
              ) : payments.length > 0 ? (
                payments.map((payment) => {
                  const statusInfo = STATUS_CONFIG[payment.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING;
                  const StatusIcon = statusInfo.icon;

                  return (
                    <TableRow key={payment.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors group">
                      <TableCell className="pl-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                            <CreditCard className="h-5 w-5 text-slate-900" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">#{payment.transactionId || 'N/A'}</p>
                            <p className="text-[10px] text-primary font-black uppercase tracking-wider">
                              For Order: {payment.order?.orderNumber}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 bg-slate-50 rounded-lg flex items-center justify-center">
                            <Building className="h-3 w-3 text-slate-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-xs truncate max-w-[150px]">
                              {payment.order?.tailor?.businessName || payment.order?.tailor?.name}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-black text-slate-900">GH₵ {payment.amount.toLocaleString()}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{payment.method}</p>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(
                          "px-3 py-1 rounded-lg border flex items-center gap-1.5 w-fit",
                          statusInfo.color
                        )}>
                          <StatusIcon className="h-3 w-3" />
                          <span className="font-bold uppercase text-[10px] tracking-wider">{statusInfo.label}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-slate-500 font-bold text-xs">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(payment.createdAt), 'dd MMM yyyy')}
                        </div>
                      </TableCell>
                      <TableCell className="pr-8 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white hover:shadow-sm">
                              <MoreVertical className="h-4 w-4 text-slate-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 border-slate-100 shadow-xl">
                            <DropdownMenuLabel className="font-bold text-slate-400 text-xs px-3">Transaction Details</DropdownMenuLabel>
                            <DropdownMenuItem className="rounded-xl h-10 font-bold focus:bg-slate-50 cursor-pointer">
                              <ExternalLink className="mr-3 h-4 w-4 text-slate-400" />
                              View Hubtel Log
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-xl h-10 font-bold focus:bg-slate-50 cursor-pointer">
                              <Building className="mr-3 h-4 w-4 text-slate-400" />
                              Worshop Financials
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-50" />
                            <DropdownMenuItem className="rounded-xl h-10 font-bold focus:bg-slate-50 cursor-pointer">
                              Download Receipt
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center">
                        <Wallet className="h-8 w-8 text-slate-200" />
                      </div>
                      <p className="text-slate-400 font-bold">No transactions found matching your criteria.</p>
                      <Button variant="link" className="text-primary font-bold" onClick={() => { setSearch(''); setStatus(''); }}>
                        Clear all filters
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>

        {pagination && pagination.totalPages > 1 && (
          <div className="p-8 bg-slate-50/50 flex items-center justify-between">
            <p className="text-sm font-bold text-slate-400">
              Showing <span className="text-slate-900">{((page - 1) * pagination.pageSize) + 1}</span> to <span className="text-slate-900">{Math.min(page * pagination.pageSize, pagination.total)}</span> of <span className="text-slate-900">{pagination.total}</span> payments
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl h-10 font-bold gap-2"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="bg-white border border-slate-200 rounded-xl px-4 h-10 flex items-center justify-center font-black text-sm">
                {page}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl h-10 font-bold gap-2"
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
