'use client';

import { motion } from 'framer-motion';
import { CreditCard, FileText, History, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ANIMATIONS } from '@/lib/design-system';

export default function PaymentsHelpPage() {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={ANIMATIONS.staggerContainer}
      className="space-y-12"
    >
      <motion.div variants={ANIMATIONS.fadeInUp} className="space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-ghana-red/10 flex items-center justify-center text-ghana-red mb-6">
          <History className="w-8 h-8" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black font-heading text-white">
          Payments & Invoices
        </h1>
        <p className="text-xl text-zinc-400 max-w-3xl">
          Track your deposits, final payments, and download digital invoices for your records.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        <motion.div variants={ANIMATIONS.fadeInUp} className="lg:col-span-2 space-y-8">
          <section className="space-y-6">
            <h2 className="text-2xl font-bold font-heading flex items-center gap-2 text-white">
              <CreditCard className="w-6 h-6 text-ghana-red" />
              Secure Digital Payments
            </h2>
            <p className="text-zinc-400">
              Pay your tailor securely via Paystack. Your payments are recorded instantly in the
              portal, giving you a clear history of every transaction.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold font-heading flex items-center gap-2 text-white">
              <FileText className="w-6 h-6 text-ghana-red" />
              Managing Invoices
            </h2>
            <p className="text-zinc-400">
              Every payment generates a digital invoice. You can download these as PDFs at any time
              from your <strong>Payments</strong> page.
            </p>
          </section>
        </motion.div>

        <motion.div variants={ANIMATIONS.fadeInUp} className="space-y-6">
          <Card className="bg-ghana-gold/10 border-ghana-gold/20">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-ghana-gold font-bold">
                <ShieldCheck className="w-5 h-5" />
                Verified
              </div>
              <p className="text-sm text-zinc-500 font-medium">
                Payments made through the portal are verified by StitchCraft, ensuring your tailor
                receives the funds and your order status is updated automatically.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
