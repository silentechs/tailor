'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  CreditCard,
  Download,
  HelpCircle,
  History,
  Loader2,
  Receipt,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export default function StudioPaymentsPage() {
  const { data: pData, isLoading } = useQuery({
    queryKey: ['studio', 'payments'],
    queryFn: async () => {
      const res = await fetch('/api/studio/payments');
      if (!res.ok) throw new Error('Failed to fetch payments');
      return res.json();
    },
  });

  const [processing, setProcessing] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-ghana-gold" />
      </div>
    );
  }

  const { invoices, payments } = pData?.data || { invoices: [], payments: [] };

  async function handleSettle(invoice: any) {
    if (!invoice.orderId) return;
    setProcessing(invoice.id);
    try {
      const res = await fetch('/api/studio/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: invoice.orderId,
          amount: Number(invoice.amount), // Settle full invoice amount
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Initialization failed');

      window.location.href = json.data.authorization_url;
    } catch (e) {
      console.error(e);
      toast.error('Failed to initialize payment. Please try again.');
      setProcessing(null);
    }
  }

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-ghana-gold font-black uppercase tracking-[0.3em] text-[10px] mb-4 block">
              Financial Terminal
            </span>
            <h1 className="text-5xl md:text-8xl font-black font-heading tracking-tighter uppercase italic leading-none">
              Settlement <br /> Hub.
            </h1>
          </div>
          <Link
            href="/studio/help/payments"
            className="p-3 rounded-2xl bg-white/5 text-ghana-gold hover:bg-white/10 transition-colors border border-white/5 mb-1 self-end"
            title="View Payment Guide"
          >
            <HelpCircle className="h-6 w-6" />
          </Link>
        </div>
        <div className="flex flex-col items-end">
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mb-2">
            Account Balance
          </p>
          <div className="text-5xl font-black font-heading text-white italic">₵0.00</div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Pending Invoices */}
        <div className="lg:col-span-8 space-y-8">
          <section className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-[3rem] p-10">
            <h2 className="text-3xl font-black font-heading uppercase mb-10 flex items-center gap-4">
              <Receipt className="h-7 w-7 text-ghana-gold" />
              Invoices
            </h2>

            <Table>
              <TableHeader className="border-b-2 border-white/5">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-500 py-6">
                    Reference
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Service
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Amount
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Status
                  </TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv: any) => (
                  <TableRow
                    key={inv.id}
                    className="border-b border-white/5 hover:bg-white/5 group transition-colors"
                  >
                    <TableCell className="py-8">
                      <p className="font-black text-white italic">#{inv.invoiceNumber}</p>
                      <span className="text-[10px] font-bold text-zinc-600 uppercase">
                        {new Date(inv.createdAt).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <p className="font-bold uppercase text-xs tracking-tight text-white mb-1">
                        {inv.order?.garmentType}
                      </p>
                      <span className="text-[10px] font-bold text-zinc-600 uppercase">
                        Order #{inv.order?.orderNumber}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xl font-black font-heading text-ghana-gold italic">
                        ₵{inv.amount}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          'rounded-full px-4 py-1 font-black text-[10px] uppercase',
                          inv.status === 'PAID'
                            ? 'bg-emerald-500/20 text-emerald-500'
                            : 'bg-ghana-gold/20 text-ghana-gold'
                        )}
                      >
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-12 w-12 rounded-2xl hover:bg-white/10 group-hover:bg-white/10"
                      >
                        <Download className="h-5 w-5 text-zinc-400" />
                      </Button>
                      {inv.status !== 'PAID' && (
                        <Button
                          onClick={() => handleSettle(inv)}
                          disabled={processing === inv.id}
                          className="ml-4 rounded-2xl bg-white text-ghana-black font-black uppercase text-[10px] tracking-widest h-12 px-8 hover:bg-zinc-200"
                        >
                          {processing === inv.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Settle'
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {invoices.length === 0 && (
              <div className="py-20 text-center">
                <p className="text-zinc-600 font-bold uppercase tracking-widest text-xs italic">
                  No invoice history found
                </p>
              </div>
            )}
          </section>
        </div>

        {/* Transaction History Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          <section className="bg-zinc-900 border border-white/5 rounded-[3rem] p-8">
            <h3 className="text-xl font-black font-heading uppercase mb-8 flex items-center gap-3">
              <History className="h-5 w-5 text-ghana-gold" />
              Recent Activity
            </h3>
            <div className="space-y-8">
              {payments.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-white/5 rounded-xl flex items-center justify-center transition-colors group-hover:bg-ghana-gold/10">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase text-white mb-0.5">
                        {p.paymentMethod}
                      </p>
                      <p className="text-[10px] font-bold text-zinc-600 uppercase italic">
                        {new Date(p.paidAt).toLocaleDateString('en-GH', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-sm text-white italic">₵{p.amount}</p>
                  </div>
                </div>
              ))}

              {payments.length === 0 && (
                <div className="py-10 text-center">
                  <p className="text-zinc-600 font-bold uppercase tracking-widest text-[10px]">
                    No recent transactions
                  </p>
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              className="w-full mt-12 rounded-2xl h-14 border border-white/5 font-black uppercase tracking-widest text-[10px] hover:bg-white/5"
            >
              View Full Ledger
            </Button>
          </section>

          {/* Secure Payment Note */}
          <div className="p-8 bg-zinc-900/50 border border-white/5 rounded-[2.5rem] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
              <CreditCard className="h-20 w-20" />
            </div>
            <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4">
              Secure Gateway
            </h4>
            <p className="text-zinc-500 font-bold leading-relaxed italic text-xs mb-6">
              All transactions are end-to-end encrypted via Paystack securely. We do not store your
              card details.
            </p>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                className="h-full w-1/3 bg-ghana-gold/50"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
