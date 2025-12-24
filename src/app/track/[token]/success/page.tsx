'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Loader2, Scissors } from 'lucide-react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

function SuccessContent() {
    const { token } = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [verifying, setVerifying] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const reference = searchParams.get('reference');
    const amount = searchParams.get('amount');

    useEffect(() => {
        const verifyPayment = async () => {
            try {
                const res = await fetch(`/api/track/pay/verify?reference=${reference}`);
                const data = await res.json();
                if (!data.success) throw new Error(data.error || 'Verification failed');
                setVerifying(false);
            } catch (_err) {
                setError('Could not verify payment status');
                setVerifying(false);
            }
        };

        if (reference) verifyPayment();
    }, [reference]);

    if (verifying) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <h2 className="text-xl font-bold font-heading uppercase tracking-tight">Verifying your payment...</h2>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-6">
                <h1 className="text-3xl font-black text-red-500 font-heading">PAYMENT ISSUE</h1>
                <p className="text-muted-foreground">{error}</p>
                <Button onClick={() => router.push(`/track/${token}`)} className="rounded-xl h-12 px-8">
                    Return to Tracking
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center overflow-hidden">
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 12 }}
                className="h-24 w-24 bg-primary rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-primary/20"
            >
                <CheckCircle2 className="h-12 w-12 text-white" />
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 mb-12"
            >
                <h1 className="text-5xl font-black font-heading uppercase italic tracking-tighter leading-none">
                    Payment <br /> <span className="text-primary italic">Success!</span>
                </h1>
                <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">
                    Amount: GH₵ {parseFloat(amount || '0').toFixed(2)}
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
            >
                <Button
                    onClick={() => router.push(`/track/${token}`)}
                    className="rounded-2xl h-16 px-12 text-lg font-black bg-primary text-white hover:bg-primary/90 shadow-xl shadow-primary/20 group"
                >
                    <ArrowLeft className="mr-2 h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                    Back to Tracking
                </Button>
            </motion.div>

            <div className="fixed bottom-12 opacity-10 flex items-center gap-2">
                <Scissors className="h-5 w-5" />
                <span className="font-black uppercase tracking-tighter italic">StitchCraft Ghana</span>
            </div>
        </div>
    );
}

export default function TrackingSuccessPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SuccessContent />
        </Suspense>
    );
}
