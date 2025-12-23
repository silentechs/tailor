'use client';

import {
  MessageSquare,
  Search,
  Filter,
  MoreVertical,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  User,
  Package,
  Clock,
  CheckCircle2,
  Mail
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export default function AdminMessagingTrackingPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  const fetchMessages = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        page: page.toString(),
        pageSize: '20'
      });
      const res = await fetch(`/api/admin/messaging-tracking?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setMessages(json.data);
        setPagination(json.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchMessages();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-black font-heading text-slate-900 tracking-tight">
            Communications <span className="text-primary italic">Audit</span>
          </h1>
          <p className="text-slate-500 font-medium">
            Track and monitor and order-related messages across the platform for quality control.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
          <Badge variant="outline" className="rounded-xl px-4 py-1.5 font-bold border-slate-200 text-slate-600">
            Total Messages: {pagination?.total || 0}
          </Badge>
        </div>
      </div>

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="p-8 border-b border-slate-50">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <form onSubmit={handleSearch} className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search messages, order numbers or sender names..."
                className="pl-12 h-14 bg-slate-50 border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-primary/20 transition-all font-medium"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="h-14 px-6 rounded-2xl border-slate-100 hover:bg-slate-50 font-bold text-slate-600 gap-2"
                onClick={fetchMessages}
              >
                <Filter className="h-5 w-5 text-slate-400" />
                Filter Logs
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-slate-50 hover:bg-transparent h-14">
                <TableHead className="pl-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Sender</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Message Content</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Context / Order</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Timestamp</TableHead>
                <TableHead className="text-right pr-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <TableRow key={i} className="animate-pulse border-slate-50">
                    <TableCell colSpan={5} className="h-20 bg-white/50" />
                  </TableRow>
                ))
              ) : messages.length > 0 ? (
                messages.map((message) => (
                  <TableRow key={message.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors group">
                    <TableCell className="pl-8 py-5">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-slate-100 rounded-xl">
                          <AvatarImage src={message.sender?.profileImage} />
                          <AvatarFallback className="bg-slate-900 text-white text-[10px] font-black">
                            {message.sender?.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">{message.sender?.name || 'Unknown User'}</p>
                          <p className="text-[10px] font-black text-primary uppercase tracking-wider">{message.senderType}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[400px]">
                        <p className="text-sm font-medium text-slate-600 line-clamp-2 leading-relaxed">
                          {message.message}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                          <Package className="h-3 w-3 text-slate-500" />
                        </div>
                        <p className="font-bold text-slate-900 text-xs">#{message.order?.orderNumber}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs font-bold text-slate-400">
                        {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                      </p>
                    </TableCell>
                    <TableCell className="pr-8 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white hover:shadow-sm">
                            <MoreVertical className="h-4 w-4 text-slate-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 border-slate-100 shadow-xl">
                          <DropdownMenuLabel className="font-bold text-slate-400 text-xs px-3">Audit Actions</DropdownMenuLabel>
                          <DropdownMenuItem className="rounded-xl h-10 font-bold focus:bg-slate-50 cursor-pointer">
                            <ExternalLink className="mr-3 h-4 w-4 text-slate-400" />
                            View Full Thread
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-xl h-10 font-bold focus:bg-slate-50 cursor-pointer">
                            <ShieldAlert className="mr-3 h-4 w-4 text-slate-400" />
                            Report Message
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-50" />
                          <DropdownMenuItem className="rounded-xl h-10 font-bold focus:bg-red-50 focus:text-red-600 text-red-500 cursor-pointer">
                            Flag for Review
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center">
                        <MessageSquare className="h-8 w-8 text-slate-200" />
                      </div>
                      <p className="text-slate-400 font-bold">No order messages found matching your criteria.</p>
                      <Button variant="link" className="text-primary font-bold" onClick={() => setSearch('')}>
                        Clear search
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
              Showing <span className="text-slate-900">{((page - 1) * pagination.pageSize) + 1}</span> to <span className="text-slate-900">{Math.min(page * pagination.pageSize, pagination.total)}</span> of <span className="text-slate-900">{pagination.total}</span> messages
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
