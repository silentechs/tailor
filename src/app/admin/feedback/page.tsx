'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Bug,
  CheckCircle2,
  ChevronDown,
  Clock,
  Eye,
  Filter,
  HeartHandshake,
  Lightbulb,
  Loader2,
  MessageSquare,
  RefreshCw,
  Search,
  Send,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

// Types
interface Feedback {
  id: string;
  category: string;
  priority: string;
  status: string;
  subject: string;
  message: string;
  email: string | null;
  name: string | null;
  userAgent: string | null;
  pageUrl: string | null;
  adminNotes: string | null;
  respondedAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    businessName: string | null;
    profileImage: string | null;
  } | null;
}

// Category config
const CATEGORIES = {
  BUG_REPORT: { label: 'Bug Report', icon: Bug, color: 'text-red-500', bg: 'bg-red-50' },
  FEATURE_REQUEST: { label: 'Feature Request', icon: Lightbulb, color: 'text-amber-500', bg: 'bg-amber-50' },
  GENERAL_FEEDBACK: { label: 'General', icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-50' },
  SUPPORT_REQUEST: { label: 'Support', icon: HeartHandshake, color: 'text-purple-500', bg: 'bg-purple-50' },
  COMPLAINT: { label: 'Complaint', icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50' },
  PRAISE: { label: 'Praise', icon: Star, color: 'text-emerald-500', bg: 'bg-emerald-50' },
};

const PRIORITIES = {
  LOW: { label: 'Low', color: 'text-slate-500', bg: 'bg-slate-100' },
  MEDIUM: { label: 'Medium', color: 'text-amber-600', bg: 'bg-amber-100' },
  HIGH: { label: 'High', color: 'text-orange-600', bg: 'bg-orange-100' },
  URGENT: { label: 'Urgent', color: 'text-red-600', bg: 'bg-red-100' },
};

const STATUSES = {
  NEW: { label: 'New', color: 'text-blue-600', bg: 'bg-blue-100' },
  IN_REVIEW: { label: 'In Review', color: 'text-purple-600', bg: 'bg-purple-100' },
  IN_PROGRESS: { label: 'In Progress', color: 'text-amber-600', bg: 'bg-amber-100' },
  RESPONDED: { label: 'Responded', color: 'text-cyan-600', bg: 'bg-cyan-100' },
  RESOLVED: { label: 'Resolved', color: 'text-emerald-600', bg: 'bg-emerald-100' },
  CLOSED: { label: 'Closed', color: 'text-slate-500', bg: 'bg-slate-100' },
};

export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = React.useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = React.useState<string | null>(null);
  const [selectedFeedback, setSelectedFeedback] = React.useState<Feedback | null>(null);
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);
  const [isResponseOpen, setIsResponseOpen] = React.useState(false);
  const [responseText, setResponseText] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [statusCounts, setStatusCounts] = React.useState<Record<string, number>>({});

  // Fetch feedbacks
  const fetchFeedbacks = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (categoryFilter) params.set('category', categoryFilter);

      const response = await fetch(`/api/feedback?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setFeedbacks(result.data);
        setStatusCounts(result.meta.statusCounts || {});
      }
    } catch (error) {
      toast.error('Failed to fetch feedback');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, categoryFilter]);

  React.useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  // Update feedback status
  const updateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        toast.success('Status updated');
        fetchFeedbacks();
        if (selectedFeedback?.id === id) {
          setSelectedFeedback((prev) => (prev ? { ...prev, status } : null));
        }
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  // Send response
  const sendResponse = async () => {
    if (!selectedFeedback || !responseText.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/feedback/${selectedFeedback.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'RESPONDED',
          response: responseText,
        }),
      });

      if (response.ok) {
        toast.success('Response sent successfully');
        setIsResponseOpen(false);
        setResponseText('');
        fetchFeedbacks();
      }
    } catch (error) {
      toast.error('Failed to send response');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete feedback
  const deleteFeedback = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return;

    try {
      const response = await fetch(`/api/feedback/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Feedback deleted');
        fetchFeedbacks();
        if (selectedFeedback?.id === id) {
          setIsDetailOpen(false);
          setSelectedFeedback(null);
        }
      }
    } catch (error) {
      toast.error('Failed to delete feedback');
    }
  };

  const totalNew = statusCounts['NEW'] || 0;
  const totalUrgent = feedbacks.filter((f) => f.priority === 'URGENT' && f.status === 'NEW').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-black font-heading text-slate-900 tracking-tight">
            User <span className="text-primary italic">Feedback</span>
          </h1>
          <p className="text-slate-500 font-medium">
            Review and respond to feedback from all platform users.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {totalNew > 0 && (
            <Badge className="bg-blue-100 text-blue-700 border-none px-4 py-2 text-sm font-bold">
              {totalNew} New
            </Badge>
          )}
          {totalUrgent > 0 && (
            <Badge className="bg-red-100 text-red-700 border-none px-4 py-2 text-sm font-bold animate-pulse">
              {totalUrgent} Urgent
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchFeedbacks}
            className="h-10 rounded-xl gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {Object.entries(STATUSES).map(([key, config]) => {
          const count = statusCounts[key] || 0;
          const isActive = statusFilter === key;
          return (
            <button
              key={key}
              onClick={() => setStatusFilter(isActive ? null : key)}
              className={cn(
                'p-4 rounded-2xl border-2 transition-all text-left',
                isActive
                  ? 'border-primary bg-primary/5'
                  : 'border-transparent bg-white hover:border-slate-200'
              )}
            >
              <p className="text-2xl font-black text-slate-900">{count}</p>
              <p className={cn('text-xs font-bold uppercase tracking-wider', config.color)}>
                {config.label}
              </p>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <Card className="border-none shadow-sm rounded-2xl">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search feedback..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 rounded-xl border-slate-200"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-11 rounded-xl gap-2 min-w-[160px]">
                  <Filter className="h-4 w-4" />
                  {categoryFilter ? CATEGORIES[categoryFilter as keyof typeof CATEGORIES]?.label : 'All Categories'}
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl">
                <DropdownMenuItem onClick={() => setCategoryFilter(null)}>
                  All Categories
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {Object.entries(CATEGORIES).map(([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <DropdownMenuItem key={key} onClick={() => setCategoryFilter(key)}>
                      <Icon className={cn('h-4 w-4 mr-2', config.color)} />
                      {config.label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {(statusFilter || categoryFilter) && (
              <Button
                variant="ghost"
                className="h-11 rounded-xl text-slate-500"
                onClick={() => {
                  setStatusFilter(null);
                  setCategoryFilter(null);
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Feedback List */}
      <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-slate-500">Loading feedback...</p>
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No feedback found</p>
            <p className="text-sm text-slate-400 mt-1">
              {search || statusFilter || categoryFilter
                ? 'Try adjusting your filters'
                : 'Feedback from users will appear here'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {feedbacks.map((feedback, idx) => {
              const category = CATEGORIES[feedback.category as keyof typeof CATEGORIES];
              const priority = PRIORITIES[feedback.priority as keyof typeof PRIORITIES];
              const status = STATUSES[feedback.status as keyof typeof STATUSES];
              const Icon = category?.icon || MessageSquare;

              return (
                <motion.div
                  key={feedback.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="p-6 hover:bg-slate-50/50 transition-colors cursor-pointer group"
                  onClick={() => {
                    setSelectedFeedback(feedback);
                    setIsDetailOpen(true);
                  }}
                >
                  <div className="flex items-start gap-4">
                    {/* Category Icon */}
                    <div className={cn('h-12 w-12 rounded-2xl flex items-center justify-center shrink-0', category?.bg)}>
                      <Icon className={cn('h-6 w-6', category?.color)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-slate-900 line-clamp-1">{feedback.subject}</h3>
                          <Badge className={cn('text-[10px] font-black uppercase border-none', priority?.bg, priority?.color)}>
                            {priority?.label}
                          </Badge>
                          <Badge className={cn('text-[10px] font-black uppercase border-none', status?.bg, status?.color)}>
                            {status?.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFeedback(feedback);
                              setIsResponseOpen(true);
                            }}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-red-500 hover:text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteFeedback(feedback.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <p className="text-sm text-slate-500 line-clamp-2 mb-3">{feedback.message}</p>

                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage
                              src={
                                feedback.user?.profileImage ||
                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${feedback.user?.name || feedback.name}`
                              }
                            />
                            <AvatarFallback className="text-[8px]">
                              {(feedback.user?.name || feedback.name || 'A')[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{feedback.user?.name || feedback.name || 'Anonymous'}</span>
                          {feedback.user?.role && (
                            <Badge variant="outline" className="text-[8px] h-4 px-1.5">
                              {feedback.user.role}
                            </Badge>
                          )}
                        </div>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(feedback.createdAt).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-3xl p-0 gap-0 overflow-hidden">
          {selectedFeedback && (
            <>
              {/* Header */}
              <div className={cn('px-8 py-6 border-b', CATEGORIES[selectedFeedback.category as keyof typeof CATEGORIES]?.bg)}>
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                    {(() => {
                      const Icon = CATEGORIES[selectedFeedback.category as keyof typeof CATEGORIES]?.icon || MessageSquare;
                      return (
                        <Icon
                          className={cn('h-7 w-7', CATEGORIES[selectedFeedback.category as keyof typeof CATEGORIES]?.color)}
                        />
                      );
                    })()}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-slate-900 mb-2">{selectedFeedback.subject}</h2>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        className={cn(
                          'text-[10px] font-black uppercase border-none',
                          PRIORITIES[selectedFeedback.priority as keyof typeof PRIORITIES]?.bg,
                          PRIORITIES[selectedFeedback.priority as keyof typeof PRIORITIES]?.color
                        )}
                      >
                        {PRIORITIES[selectedFeedback.priority as keyof typeof PRIORITIES]?.label}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Badge
                            className={cn(
                              'text-[10px] font-black uppercase border-none cursor-pointer',
                              STATUSES[selectedFeedback.status as keyof typeof STATUSES]?.bg,
                              STATUSES[selectedFeedback.status as keyof typeof STATUSES]?.color
                            )}
                          >
                            {STATUSES[selectedFeedback.status as keyof typeof STATUSES]?.label}
                            <ChevronDown className="h-3 w-3 ml-1" />
                          </Badge>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="rounded-xl">
                          <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {Object.entries(STATUSES).map(([key, config]) => (
                            <DropdownMenuItem
                              key={key}
                              onClick={() => updateStatus(selectedFeedback.id, key)}
                              className={cn(selectedFeedback.status === key && 'bg-slate-100')}
                            >
                              <span className={cn('h-2 w-2 rounded-full mr-2', config.bg)} />
                              {config.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-8 space-y-6">
                {/* User Info */}
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={
                        selectedFeedback.user?.profileImage ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedFeedback.user?.name || selectedFeedback.name}`
                      }
                    />
                    <AvatarFallback>
                      {(selectedFeedback.user?.name || selectedFeedback.name || 'A')[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900">
                      {selectedFeedback.user?.name || selectedFeedback.name || 'Anonymous'}
                    </p>
                    <p className="text-sm text-slate-500">
                      {selectedFeedback.user?.email || selectedFeedback.email || 'No email provided'}
                    </p>
                  </div>
                  {selectedFeedback.user?.role && (
                    <Badge variant="outline" className="font-bold">
                      {selectedFeedback.user.role}
                    </Badge>
                  )}
                </div>

                {/* Message */}
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Message</p>
                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed bg-white border border-slate-100 rounded-xl p-4">
                    {selectedFeedback.message}
                  </p>
                </div>

                {/* Meta Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Submitted</p>
                    <p className="text-slate-700">
                      {new Date(selectedFeedback.createdAt).toLocaleString('en-GB', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                  {selectedFeedback.pageUrl && (
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Page URL</p>
                      <p className="text-slate-700 truncate">{selectedFeedback.pageUrl}</p>
                    </div>
                  )}
                </div>

                {/* Admin Notes */}
                {selectedFeedback.adminNotes && (
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Admin Notes</p>
                    <p className="text-slate-600 text-sm bg-amber-50 border border-amber-100 rounded-xl p-4">
                      {selectedFeedback.adminNotes}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="px-8 py-4 bg-slate-50 border-t flex items-center justify-between">
                <Button
                  variant="ghost"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => deleteFeedback(selectedFeedback.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" className="rounded-xl" onClick={() => setIsDetailOpen(false)}>
                    Close
                  </Button>
                  <Button
                    className="rounded-xl bg-primary hover:bg-primary/90"
                    onClick={() => {
                      setIsDetailOpen(false);
                      setIsResponseOpen(true);
                    }}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Response
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Response Dialog */}
      <Dialog open={isResponseOpen} onOpenChange={setIsResponseOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Send Response</DialogTitle>
            <DialogDescription>
              Your response will be emailed to{' '}
              <strong>{selectedFeedback?.user?.email || selectedFeedback?.email || 'the user'}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Original Feedback</p>
              <p className="text-sm text-slate-700 font-medium">{selectedFeedback?.subject}</p>
            </div>

            <Textarea
              placeholder="Type your response here..."
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              className="min-h-[150px] rounded-xl"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setIsResponseOpen(false)}>
              Cancel
            </Button>
            <Button
              className="rounded-xl bg-primary hover:bg-primary/90"
              onClick={sendResponse}
              disabled={isSubmitting || !responseText.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Response
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

