'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  Loader2,
  MapPin,
  Package,
  Search,
  Star,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default function StudioOrdersPage() {
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const queryClient = useQueryClient();

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['studio', 'orders'],
    queryFn: async () => {
      const res = await fetch('/api/studio/orders');
      if (!res.ok) throw new Error('Failed to fetch orders');
      return res.json();
    },
  });

  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOrder || rating === 0) return;
      const res = await fetch('/api/studio/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder,
          rating,
          review: reviewText,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to submit feedback');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Thank you for your feedback!');
      queryClient.invalidateQueries({ queryKey: ['studio', 'orders'] });
      setRating(0);
      setReviewText('');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const payNowMutation = useMutation({
    mutationFn: async (order: any) => {
      const res = await fetch('/api/studio/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          amount: Number(order.totalAmount) - Number(order.paidAmount),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to initialize payment');
      }
      return res.json();
    },
    onSuccess: (data) => {
      if (data.data.authorization_url) {
        window.location.href = data.data.authorization_url;
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const orders = ordersData?.data || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-ghana-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-5xl font-black font-heading uppercase tracking-tighter italic">
              Garment Tracker
            </h1>
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs mt-2">
              Real-time status of your bespoke commissions
            </p>
          </div>
          <Link
            href="/studio/help/tracking"
            className="p-3 rounded-2xl bg-white/5 text-ghana-gold hover:bg-white/10 transition-colors border border-white/5"
            title="View Tracking Help Guide"
          >
            <HelpCircle className="h-6 w-6" />
          </Link>
        </div>
        <div className="relative w-full max-w-xs group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-ghana-gold transition-colors" />
          <Input
            placeholder="Filter orders..."
            className="bg-white/5 border-white/5 h-11 pl-11 rounded-xl text-sm focus-visible:ring-1 focus-visible:ring-ghana-gold/30"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Order List */}
        <div className="lg:col-span-5 space-y-4">
          {orders.map((order: any) => (
            <motion.div
              layout
              key={order.id}
              onClick={() => setSelectedOrder(order.id)}
              className={cn(
                'group cursor-pointer rounded-[2rem] p-6 border transition-all duration-500 relative overflow-hidden',
                selectedOrder === order.id
                  ? 'bg-ghana-gold text-ghana-black border-ghana-gold shadow-2xl shadow-ghana-gold/20 scale-[1.02]'
                  : 'bg-zinc-900/50 border-white/5 hover:border-white/20'
              )}
            >
              {selectedOrder === order.id && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 bg-ghana-gold"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}

              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span
                      className={cn(
                        'text-[10px] font-black uppercase tracking-[0.2em]',
                        selectedOrder === order.id ? 'text-ghana-black/60' : 'text-zinc-500'
                      )}
                    >
                      {order.organization.name}
                    </span>
                    <h3 className="text-xl font-black font-heading mt-1 uppercase leading-tight">
                      {order.garmentType}
                    </h3>
                  </div>
                  <Badge
                    className={cn(
                      'rounded-full px-3 py-0.5 font-black text-[10px] uppercase',
                      selectedOrder === order.id
                        ? 'bg-ghana-black text-white'
                        : 'bg-white/10 text-zinc-300'
                    )}
                  >
                    {order.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
                  <div className="flex items-center gap-1.5 text-inherit opacity-70">
                    <Calendar className="h-3 w-3" />
                    {new Date(order.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1.5 text-inherit opacity-70">
                    <Package className="h-3 w-3" />#{order.orderNumber}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Timeline View */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {selectedOrder ? (
              <motion.div
                key={selectedOrder}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.4 }}
                className="bg-zinc-900 border border-white/5 rounded-[3rem] p-10 lg:p-14 sticky top-32 shadow-3xl shadow-black/50"
              >
                {/* Detailed Header */}
                <div className="flex flex-col md:flex-row justify-between gap-8 mb-16 pb-12 border-b border-white/5">
                  <div>
                    <h2 className="text-4xl font-black font-heading uppercase mb-2 tracking-tighter">
                      Garment Stage
                    </h2>
                    <div className="flex flex-wrap gap-4 mt-4">
                      <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl">
                        <MapPin className="h-4 w-4 text-ghana-gold" />
                        <span className="text-xs font-bold uppercase text-zinc-400">
                          {orders.find((o: any) => o.id === selectedOrder).organization.city ||
                            'Accra, GH'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mb-1">
                      Current Status
                    </p>
                    <span className="text-3xl font-black font-heading text-ghana-gold uppercase italic">
                      {orders.find((o: any) => o.id === selectedOrder).status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Vertical Timeline */}
                <div className="relative space-y-12">
                  <div className="absolute left-[13px] top-2 bottom-2 w-0.5 bg-zinc-800" />

                  {orders
                    .find((o: any) => o.id === selectedOrder)
                    .timeline.map((step: any, _idx: number) => (
                      <div key={`${step.label}-${step.date ?? ''}`} className="flex gap-8 group">
                        <div className="relative z-10 mt-1.5 transition-transform duration-300 group-hover:scale-125">
                          {step.completed ? (
                            <div className="h-7 w-7 rounded-full bg-ghana-gold flex items-center justify-center shadow-lg shadow-ghana-gold/30">
                              <CheckCircle2 className="h-4 w-4 text-ghana-black" />
                            </div>
                          ) : step.current ? (
                            <div className="h-7 w-7 rounded-full bg-ghana-black border-2 border-ghana-gold flex items-center justify-center">
                              <motion.div
                                animate={{ scale: [1, 1.3, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="h-2 w-2 rounded-full bg-ghana-gold"
                              />
                            </div>
                          ) : (
                            <div className="h-7 w-7 rounded-full bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center" />
                          )}
                        </div>

                        <div
                          className={cn(
                            'flex-1 transition-all duration-300',
                            step.completed || step.current ? 'opacity-100' : 'opacity-30'
                          )}
                        >
                          <h4
                            className={cn(
                              'text-lg font-black uppercase tracking-tight',
                              step.current ? 'text-ghana-gold' : 'text-white'
                            )}
                          >
                            {step.label}
                          </h4>
                          {step.date && (
                            <p className="text-xs font-bold text-zinc-500 mt-1 uppercase">
                              {new Date(step.date).toLocaleDateString('en-GH', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>

                <div className="mt-20 pt-10 border-t border-white/5 space-y-12">
                  {orders.find((o: any) => o.id === selectedOrder).status === 'DELIVERED' && (
                    <div className="bg-ghana-gold/5 rounded-[2rem] p-8 border border-ghana-gold/10">
                      <h4 className="text-xl font-black font-heading uppercase mb-4 text-ghana-gold">
                        Share your experience
                      </h4>
                      <p className="text-zinc-500 text-sm font-bold mb-6">
                        How was the fit and finish of your{' '}
                        {orders.find((o: any) => o.id === selectedOrder).garmentType}?
                      </p>

                      {/* Rating Stars */}
                      <div className="flex gap-2 mb-8">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className={cn(
                              'h-10 w-10 rounded-xl flex items-center justify-center transition-all',
                              rating >= star
                                ? 'bg-ghana-gold text-ghana-black'
                                : 'bg-white/5 text-zinc-600 hover:bg-white/10'
                            )}
                          >
                            <Star className={cn('h-5 w-5', rating >= star && 'fill-current')} />
                          </button>
                        ))}
                      </div>

                      <textarea
                        className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-sm font-bold mb-6 min-h-[100px] focus:ring-1 focus:ring-ghana-gold/30"
                        placeholder="Any extra thoughts on the craftsmanship?"
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                      />

                      <Button
                        className="w-full rounded-xl bg-ghana-gold text-ghana-black font-black uppercase text-[10px] tracking-widest h-12"
                        disabled={submitReviewMutation.isPending || rating === 0}
                        onClick={() => submitReviewMutation.mutate()}
                      >
                        {submitReviewMutation.isPending ? 'Submitting...' : 'Submit Feedback'}
                      </Button>
                    </div>
                  )}

                  {/* Payment Section */}
                  {Number(orders.find((o: any) => o.id === selectedOrder).totalAmount) >
                    Number(orders.find((o: any) => o.id === selectedOrder).paidAmount) && (
                    <div className="bg-zinc-950/50 rounded-[2rem] p-8 border border-white/5 flex flex-col items-center text-center">
                      <Badge variant="outline" className="mb-4 border-ghana-gold text-ghana-gold">
                        Payment Pending
                      </Badge>
                      <p className="text-3xl font-black font-heading mb-2">
                        GH₵{' '}
                        {(
                          Number(orders.find((o: any) => o.id === selectedOrder).totalAmount) -
                          Number(orders.find((o: any) => o.id === selectedOrder).paidAmount)
                        ).toFixed(2)}
                      </p>
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-8">
                        Remaining balance for this order
                      </p>
                      <Button
                        className="w-full rounded-xl bg-ghana-gold text-ghana-black font-black uppercase text-[10px] tracking-widest h-14 group"
                        disabled={payNowMutation.isPending}
                        onClick={() =>
                          payNowMutation.mutate(orders.find((o: any) => o.id === selectedOrder))
                        }
                      >
                        {payNowMutation.isPending ? 'Connecting...' : 'Pay Now with Paystack'}
                        <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  )}

                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      className="rounded-2xl h-14 border-white/10 hover:bg-white/5 font-black uppercase tracking-widest text-[10px] px-10 gap-3"
                    >
                      Message Tailor <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[500px] border-2 border-dashed border-white/5 rounded-[3rem] text-zinc-700">
                <Package className="h-16 w-16 mb-4 opacity-20" />
                <p className="font-bold uppercase tracking-[0.2em] text-sm">
                  Select an order to track progress
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
