'use client';

import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reference = searchParams.get('reference');
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // If it's a simulation reference, we just confirm it
        if (reference?.startsWith('SIM-REF')) {
          const res = await fetch('/api/studio/payments/confirm-sim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reference, orderId, amount: parseFloat(amount || '0') }),
          });
          if (!res.ok) throw new Error('Verification failed');
        } else {
          // Real Paystack verification
          const res = await fetch(`/api/studio/payments/verify?reference=${reference}`);
          const data = await res.json();
          if (!data.success) throw new Error(data.error || 'Verification failed');
        }
        setVerifying(false);
      } catch (_err) {
        setError('Could not verify payment status');
        setVerifying(false);
      }
    };

    if (reference) verifyPayment();
  }, [reference, orderId, amount]);

  if (verifying) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Loader2 className="h-12 w-12 animate-spin text-ghana-gold mb-4" />
        <h1 className="text-2xl font-black uppercase italic">Verifying Payment...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-2xl font-black uppercase text-red-500 mb-4 italic">Oops!</h1>
        <p className="font-bold text-zinc-500 mb-8">{error}</p>
        <Button onClick={() => router.push('/studio/orders')} className="rounded-2xl">
          Return to Orders
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 12 }}
        className="h-24 w-24 bg-emerald-500 rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-emerald-500/20"
      >
        <CheckCircle2 className="h-12 w-12 text-white" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-5xl font-black font-heading uppercase italic tracking-tighter mb-4"
      >
        Payment <br /> Received.
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-zinc-500 font-bold uppercase tracking-widest text-xs mb-12"
      >
        Reference: {reference} <br />
        Amount: GH₵ {parseFloat(amount || '0').toFixed(2)}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Button
          onClick={() => router.push('/studio/orders')}
          className="rounded-2xl h-16 px-12 text-lg font-black bg-ghana-gold text-ghana-black hover:bg-ghana-gold/90 group"
        >
          Back to My Orders{' '}
          <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </Button>
      </motion.div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
