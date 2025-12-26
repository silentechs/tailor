'use client';

import {
  Package,
  Search,
  Filter,
  MoreVertical,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle
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
import { formatDistanceToNow } from 'date-fns';

const STATUS_CONFIG = {
  PENDING: { label: 'Pending', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: TrendingUp },
  READY_FOR_FITTING: { label: 'Fitting', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: CheckCircle2 },
  COMPLETED: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  CANCELLED: { label: 'Cancelled', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: AlertCircle },
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        status,
        page: page.toString(),
        pageSize: '10'
      });
      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setOrders(json.data);
        setPagination(json.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, status]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-4xl font-black font-heading text-slate-900 tracking-tight">
            Order <span className="text-primary italic">Tracking</span>
          </h1>
          <p className="text-slate-500 font-medium text-sm sm:text-base">
            Monitor and manage all active orders across the platform.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
          <Badge variant="outline" className="rounded-xl px-4 py-1.5 font-bold border-slate-200 text-slate-600">
            Total Orders: {pagination?.total || 0}
          </Badge>
        </div>
      </div>

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="p-4 sm:p-8 border-b border-slate-50">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
            <form onSubmit={handleSearch} className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search orders, description, tailors or clients..."
                className="pl-12 h-14 bg-slate-50 border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-primary/20 transition-all font-medium"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>

            <div className="flex items-center gap-3">
              <select
                className="h-14 flex-1 lg:flex-none px-6 rounded-2xl bg-slate-50 border-none font-bold text-slate-600 focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer lg:min-w-[160px]"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="READY_FOR_FITTING">Fitting</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <Button
                variant="outline"
                className="h-14 w-14 rounded-2xl border-slate-100 hover:bg-slate-50 shrink-0"
                onClick={fetchOrders}
              >
                <Filter className="h-5 w-5 text-slate-400" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-slate-50 hover:bg-transparent h-14">
                  <TableHead className="pl-6 sm:pl-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Order</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tailor / Business</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Client</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Amount</TableHead>
                  <TableHead className="text-right pr-6 sm:pr-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <TableRow key={i} className="animate-pulse border-slate-50">
                      <TableCell colSpan={6} className="h-20 bg-white/50" />
                    </TableRow>
                  ))
                ) : orders.length > 0 ? (
                  orders.map((order) => {
                    const statusInfo = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING;
                    const StatusIcon = statusInfo.icon;

                    return (
                      <TableRow key={order.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors group">
                        <TableCell className="pl-6 sm:pl-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center shrink-0">
                              <Package className="h-5 w-5 text-white" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate">#{order.orderNumber}</p>
                              <p className="text-xs text-slate-400 font-medium truncate max-w-[180px]">
                                {order.garmentDescription}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <p className="font-bold text-slate-900 text-sm">{order.tailor.name}</p>
                            <p className="text-[10px] uppercase tracking-wider font-black text-primary truncate max-w-[150px]">
                              {order.tailor.businessName || 'Independant Tailor'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-bold text-slate-600 text-sm">{order.client.name}</p>
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
                          <div className="space-y-0.5">
                            <p className="font-black text-slate-900 text-sm">GH₵ {order.totalAmount.toLocaleString()}</p>
                            <p className="text-[10px] font-bold text-emerald-500">
                              Paid: GH₵ {order.paidAmount.toLocaleString()}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="pr-6 sm:pr-8 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white hover:shadow-sm">
                                <MoreVertical className="h-4 w-4 text-slate-400" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 border-slate-100 shadow-xl">
                              <DropdownMenuLabel className="font-bold text-slate-400 text-xs px-3">Order Management</DropdownMenuLabel>
                              <DropdownMenuItem className="rounded-xl h-10 font-bold focus:bg-slate-50 cursor-pointer">
                                <ExternalLink className="mr-3 h-4 w-4 text-slate-400" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem className="rounded-xl h-10 font-bold focus:bg-slate-50 cursor-pointer">
                                <Package className="mr-3 h-4 w-4 text-slate-400" />
                                View Client Profile
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-slate-50" />
                              <DropdownMenuItem className="rounded-xl h-10 font-bold focus:bg-red-50 focus:text-red-600 text-red-500 cursor-pointer">
                                Flag for Review
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
                          <Search className="h-8 w-8 text-slate-200" />
                        </div>
                        <p className="text-slate-400 font-bold">No orders found matching your criteria.</p>
                        <Button variant="link" className="text-primary font-bold" onClick={() => { setSearch(''); setStatus(''); }}>
                          Clear all filters
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>

        {pagination && pagination.totalPages > 1 && (
          <div className="p-4 sm:p-8 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm font-bold text-slate-400 order-2 sm:order-1">
              Showing <span className="text-slate-900">{((page - 1) * pagination.pageSize) + 1}</span> to <span className="text-slate-900">{Math.min(page * pagination.pageSize, pagination.total)}</span> of <span className="text-slate-900">{pagination.total}</span> orders
            </p>
            <div className="flex items-center gap-2 order-1 sm:order-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl h-10 font-bold gap-2"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden xs:inline">Previous</span>
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
                <span className="hidden xs:inline">Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
