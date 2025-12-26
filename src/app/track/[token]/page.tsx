'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Facebook,
  Instagram,
  Loader2,
  MessageSquare,
  Package,
  Phone,
  QrCode,
  Receipt,
  Scissors,
  Share2,
  Shield,
  Star,
  ThumbsUp,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  FEATURE_FLAGS,
  cn,
  formatCurrency,
  formatDate,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
} from '@/lib/utils';

async function getTrackingData(token: string) {
  const res = await fetch(`/api/track/${token}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to load tracking data');
  }
  const data = await res.json();
  return data.data;
}

export default function TrackingPage() {
  const { token } = useParams();
  const [selectedOrderTab, setSelectedOrderTab] = useState(0);
  const [rating, setRating] = useState(0);
  const [consent, setConsent] = useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['tracking', token],
    queryFn: () => getTrackingData(token as string),
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 relative mb-4">
          <Loader2 className="w-full h-full animate-spin text-primary opacity-20" />
          <Scissors className="absolute inset-0 m-auto h-6 w-6 text-primary" />
        </div>
        <h2 className="text-xl font-bold font-heading">Finding your designs...</h2>
        <p className="text-muted-foreground max-w-xs mt-2">
          Connecting to StitchCraft Ghana secure gateway.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="bg-red-50 p-6 rounded-full">
          <Shield className="h-12 w-12 text-red-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-heading">Access Denied</h2>
          <p className="text-muted-foreground max-w-xs mx-auto">
            This tracking link is invalid or has expired. Please contact your fashion designer for a new link.
          </p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  const { client, tailor, orders, qrCode, trackingUrl } = data;
  const activeOrder = orders[selectedOrderTab];

  const shareLink = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `${tailor.businessName} - My Order Status`,
          text: `Tracking status for my orders at ${tailor.businessName}`,
          url: trackingUrl,
        })
        .catch(() => { });
    } else {
      navigator.clipboard.writeText(trackingUrl);
      toast.success('Tracking link copied to clipboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Header / Brand */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-primary/10">
              {tailor.profileImage ? (
                <AvatarImage src={tailor.profileImage} />
              ) : (
                <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                  {tailor.businessName?.charAt(0) || tailor.name.charAt(0)}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <h1 className="font-heading font-bold text-primary leading-tight">
                {tailor.businessName || tailor.name}
              </h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                Client Tracking Portal
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full" onClick={shareLink}>
            <Share2 className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>
      </div>

      <main className="max-w-md mx-auto p-4 space-y-6 pb-24">
        {/* Welcome Card */}
        <div className="bg-primary text-primary-foreground rounded-2xl p-6 shadow-xl shadow-primary/10 relative overflow-hidden">
          <div className="relative z-10 flex justify-between items-start">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold font-heading">
                Akwaaba, {client.name.split(' ')[0]}!
              </h2>
              <p className="opacity-80 text-sm">Your bespoke pieces are coming to life.</p>
            </div>
            <Badge className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-sm">
              {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
            </Badge>
          </div>
          {/* Ghana Pattern Overlay - SVG */}
          <div className="absolute top-0 right-0 w-32 h-32 opacity-20 pointer-events-none transform translate-x-8 -translate-y-8">
            <svg
              width="128"
              height="128"
              viewBox="0 0 128 128"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <title>Kente pattern overlay</title>
              <rect width="128" height="128" fill="url(#kente_tracking)" />
              <defs>
                <pattern
                  id="kente_tracking"
                  x="0"
                  y="0"
                  width="20"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <rect width="5" height="20" fill="#CE1126" />
                  <rect x="5" width="5" height="20" fill="#FCD116" />
                  <rect x="10" width="5" height="20" fill="#006B3F" />
                  <rect x="15" width="5" height="20" fill="#000000" />
                </pattern>
              </defs>
            </svg>
          </div>
        </div>

        {/* Orders Selector if multiple */}
        {orders.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {orders.map((order: any, idx: number) => (
              <button
                key={order.id}
                type="button"
                onClick={() => setSelectedOrderTab(idx)}
                className={cn(
                  'px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border',
                  selectedOrderTab === idx
                    ? 'bg-primary text-primary-foreground border-primary shadow-md'
                    : 'bg-white text-muted-foreground border-slate-200 hover:border-primary/50'
                )}
              >
                {order.orderNumber}
              </button>
            ))}
          </div>
        )}

        {/* Tracking Timeline */}
        <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                {activeOrder.garmentType.replace(/_/g, ' ')}
              </CardTitle>
              <Badge
                className={cn('text-[10px] uppercase', ORDER_STATUS_COLORS[activeOrder.status])}
              >
                {ORDER_STATUS_LABELS[activeOrder.status]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Timeline */}
            <div className="relative pl-6 space-y-8">
              <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-slate-100" />
              {activeOrder.timeline.map((step: any, idx: number) => (
                <div key={`${step.label}-${step.date ?? ''}`} className="relative">
                  <div
                    className={cn(
                      'absolute -left-[22px] p-0.5 rounded-full z-10 bg-white',
                      step.completed
                        ? 'text-primary ring-2 ring-primary/20'
                        : step.current
                          ? 'text-primary animate-pulse ring-4 ring-primary/10'
                          : 'text-slate-300'
                    )}
                  >
                    {step.completed ? (
                      <CheckCircle2 className="h-5 w-5 fill-primary text-white" />
                    ) : (
                      <Circle
                        className={cn('h-5 w-5', step.current ? 'fill-primary/10' : 'fill-white')}
                      />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p
                      className={cn(
                        'text-sm font-bold',
                        step.current ? 'text-primary' : 'text-slate-600',
                        !step.completed && !step.current && 'text-slate-400'
                      )}
                    >
                      {step.label}
                    </p>
                    {step.date && (
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(step.date)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          {activeOrder.deadline && (
            <CardFooter className="bg-slate-50 border-t p-4 flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Expected Delivery
              </span>
              <span className="text-sm font-bold text-primary">
                {formatDate(activeOrder.deadline)}
              </span>
            </CardFooter>
          )}
        </Card>

        {/* Payment Overview */}
        <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
          <CardHeader className="pb-3 px-6 pt-6">
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4 text-emerald-500" />
              Payment Status
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6 space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl space-y-3">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-muted-foreground">Total Amount</span>
                <span>{formatCurrency(activeOrder.totalAmount || 0)}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-muted-foreground">Amount Paid</span>
                <span className="text-emerald-600">
                  {formatCurrency(activeOrder.paidAmount || 0)}
                </span>
              </div>
              <Progress
                value={((activeOrder.paidAmount || 0) / (activeOrder.totalAmount || 1)) * 100}
                className="h-2 bg-slate-200"
              />
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="text-sm font-bold">Balance Due</span>
                <span className="text-sm font-black text-red-500">
                  {formatCurrency((activeOrder.totalAmount || 0) - (activeOrder.paidAmount || 0))}
                </span>
              </div>
            </div>

            {FEATURE_FLAGS.ENABLE_PAYMENTS && activeOrder.totalAmount - activeOrder.paidAmount > 0 && (
              <Button
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/track/${token}/pay`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        orderId: activeOrder.id,
                        amount: activeOrder.totalAmount - activeOrder.paidAmount,
                      }),
                    });
                    const result = await res.json();
                    if (result.success && result.data.authorization_url) {
                      window.location.href = result.data.authorization_url;
                    } else {
                      toast.error('Could not initialize payment. Please contact your fashion designer.');
                    }
                  } catch (err) {
                    toast.error('Network error during payment initialization.');
                  }
                }}
                className="w-full bg-[#34A853] hover:bg-[#2d9248] text-white font-bold h-12 shadow-lg shadow-emerald-100 rounded-xl"
              >
                Pay Balance via Mobile Money
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Tailor Info & Support */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">
            Designer Contact
          </h3>
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 ring-4 ring-slate-50">
              <AvatarImage src={tailor.profileImage} />
              <AvatarFallback className="bg-primary text-white">
                {tailor.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-bold text-lg">{tailor.name}</p>
              <p className="text-xs text-muted-foreground">
                {tailor.businessName || 'StitchCraft Fashion Designer'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              variant="outline"
              className="shadow-none rounded-xl h-11 border-slate-200 text-slate-600"
              asChild
            >
              <a href={`tel:${tailor.phone}`}>
                <Phone className="h-4 w-4 mr-2 text-primary" />
                Call
              </a>
            </Button>
            <Button
              variant="outline"
              className="shadow-none rounded-xl h-11 border-slate-200 text-slate-600"
              asChild
            >
              <a href={`https://wa.me/${tailor.phone.replace(/[^0-9]/g, '')}`}>
                <MessageSquare className="h-4 w-4 mr-2 text-emerald-500" />
                WhatsApp
              </a>
            </Button>
          </div>
        </div>

        {/* Rating & Feedback */}
        <Card className="rounded-2xl border-none shadow-xl bg-white overflow-hidden">
          <CardHeader className="pt-8 pb-4 text-center">
            <div className="mx-auto w-12 h-12 bg-primary/5 rounded-full flex items-center justify-center mb-4">
              <ThumbsUp className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl font-heading font-bold">
              How is your experience?
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Your feedback helps {tailor.businessName} grow.
            </p>
          </CardHeader>
          <CardContent className="space-y-6 pb-8">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.button
                  key={star}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setRating(star)}
                  className="p-1"
                >
                  <Star
                    className={cn(
                      'h-10 w-10 transition-colors',
                      star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'
                    )}
                  />
                </motion.button>
              ))}
            </div>

            {rating > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-start gap-3">
                  <div className="pt-0.5">
                    <input
                      type="checkbox"
                      id="consent"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary"
                    />
                  </div>
                  <label
                    htmlFor="consent"
                    className="text-xs text-slate-600 leading-relaxed cursor-pointer"
                  >
                    I give permission to {tailor.businessName} to share photos/videos of my garment
                    on social media for showcasing purposes.
                  </label>
                </div>
                <Button
                  className="w-full h-12 rounded-xl font-bold transition-all"
                  onClick={async () => {
                    setIsSubmittingRating(true);
                    try {
                      const res = await fetch(`/api/track/${token}/feedback`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          orderId: activeOrder.id,
                          rating,
                          consent,
                        }),
                      });

                      if (!res.ok) throw new Error('Failed to submit');

                      toast.success('Thank you for your feedback!');
                      setRating(0);
                    } catch (_err) {
                      toast.error('Failed to submit feedback. Please try again.');
                    } finally {
                      setIsSubmittingRating(false);
                    }
                  }}
                  disabled={isSubmittingRating}
                >
                  {isSubmittingRating ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    'Submit Feedback'
                  )}
                </Button>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Save Link QR & Social */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-[2rem] p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 space-y-6">
            <div className="mx-auto w-32 h-32 bg-white p-3 rounded-3xl flex items-center justify-center transform hover:rotate-3 transition-transform cursor-pointer">
              {qrCode ? (
                <img src={qrCode} alt="Portal QR Code" className="w-full h-full" />
              ) : (
                <QrCode className="h-12 w-12 text-slate-200" />
              )}
            </div>
            <div className="space-y-2">
              <p className="text-lg font-bold font-heading">Save Your Portal</p>
              <p className="text-xs text-slate-400 max-w-[200px] mx-auto">
                Scan to instantly save this tracking page to your home screen.
              </p>
            </div>
            <div className="flex items-center justify-center gap-4 pt-2">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full bg-white/5 border-white/10 hover:bg-white/10"
              >
                <Instagram className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full bg-white/5 border-white/10 hover:bg-white/10"
              >
                <Facebook className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full bg-white/5 border-white/10 hover:bg-white/10"
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Kente Pattern Overlay - SVG */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
            <svg width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
              <title>Kente pattern background</title>
              <rect width="100%" height="100%" fill="url(#kente_bottom)" />
              <defs>
                <pattern
                  id="kente_bottom"
                  x="0"
                  y="0"
                  width="60"
                  height="60"
                  patternUnits="userSpaceOnUse"
                >
                  <rect width="15" height="60" fill="#CE1126" />
                  <rect x="15" width="15" height="60" fill="#FCD116" />
                  <rect x="30" width="15" height="60" fill="#006B3F" />
                  <rect x="45" width="15" height="60" fill="#000000" />
                </pattern>
              </defs>
            </svg>
          </div>
        </div>

        {/* Footer Brand */}
        <div className="text-center space-y-1 py-4">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center justify-center gap-1">
            Powered by
            <span className="text-primary font-black flex items-center gap-0.5">
              <Scissors className="h-2 w-2" />
              StitchCraft
            </span>
          </p>
        </div>
      </main>
    </div>
  );
}
