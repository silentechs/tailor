'use client';

import { motion } from 'framer-motion';
import { CreditCard, DollarSign, FileText, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ANIMATIONS } from '@/lib/design-system';

export default function FinanceHelpPage() {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={ANIMATIONS.staggerContainer}
      className="space-y-12"
    >
      <motion.div variants={ANIMATIONS.fadeInUp} className="space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-ghana-gold/10 flex items-center justify-center text-ghana-gold mb-6">
          <CreditCard className="w-8 h-8" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black font-heading">Payments & Invoicing</h1>
        <p className="text-xl text-muted-foreground max-w-3xl">
          Securely manage your workshop's finances, deposits, and professional client invoicing.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        <motion.div variants={ANIMATIONS.fadeInUp} className="lg:col-span-2 space-y-8">
          <section className="space-y-6">
            <h2 className="text-2xl font-bold font-heading flex items-center gap-2 text-ghana-gold">
              <DollarSign className="w-6 h-6" />
              Handling Deposits
            </h2>
            <p className="text-muted-foreground">
              We recommend taking a 50% deposit before beginning any production. StitchCraft allows
              you to record partial payments directly against an order.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold font-heading flex items-center gap-2 text-ghana-gold">
              <FileText className="w-6 h-6" />
              Professional Invoicing
            </h2>
            <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 space-y-4">
              <p className="text-sm font-medium text-slate-700">
                Generate sleek, PDF-friendly invoices containing your business logo, client details,
                and itemized costs. You can send these directly to clients via WhatsApp or Email.
              </p>
            </div>
          </section>
        </motion.div>

        <motion.div variants={ANIMATIONS.fadeInUp} className="space-y-6">
          <Card className="bg-primary/5 border-primary/20 overflow-hidden">
            <div className="bg-primary p-4 text-white font-bold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              Secure Payments
            </div>
            <CardContent className="p-6 text-sm text-primary/80 font-medium">
              StitchCraft records payments for your records. Ensure you use verified mobile money or
              bank transfer methods for the actual transaction.
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
