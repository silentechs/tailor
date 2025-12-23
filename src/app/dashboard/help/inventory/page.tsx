'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, ClipboardList, Layers, Package, TrendingDown, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ANIMATIONS } from '@/lib/design-system';

export default function InventoryHelpPage() {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={ANIMATIONS.staggerContainer}
      className="space-y-12"
    >
      {/* Hero */}
      <motion.div variants={ANIMATIONS.fadeInUp} className="space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
          <Layers className="w-8 h-8" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black font-heading">Inventory & Supplies</h1>
        <p className="text-xl text-muted-foreground max-w-3xl">
          Track your materials, manage shop assets, and never run out of thread again.
        </p>
      </motion.div>

      {/* Sections */}
      <div className="grid lg:grid-cols-3 gap-8">
        <motion.div variants={ANIMATIONS.fadeInUp} className="lg:col-span-2 space-y-8">
          <section className="space-y-6">
            <h2 className="text-2xl font-bold font-heading flex items-center gap-2">
              <Package className="w-6 h-6 text-primary" />
              Tracking Materials
            </h2>
            <div className="prose prose-slate max-w-none text-muted-foreground">
              <p>
                Keep a digital record of all fabrics, buttons, linings, and threads in your
                workshop.
              </p>
              <div className="grid sm:grid-cols-2 gap-4 not-prose">
                <div className="p-4 rounded-xl border-2 border-slate-100 font-medium">
                  <h4 className="font-bold text-slate-900 border-b pb-2 mb-2">Fabric Bolts</h4>
                  <p className="text-sm">
                    Track yardage, material type (e.g., Silk, Kente, Cotton), and supplier details.
                  </p>
                </div>
                <div className="p-4 rounded-xl border-2 border-slate-100 font-medium">
                  <h4 className="font-bold text-slate-900 border-b pb-2 mb-2">
                    Fasteners & Notions
                  </h4>
                  <p className="text-sm">
                    Manage counts of zippers, buttons, and specialized embroidery threads.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold font-heading flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-primary" />
              Stock Alerts
            </h2>
            <p className="text-muted-foreground">
              Set <strong>Low Stock Thresholds</strong> for essential items. StitchCraft will notify
              you when it's time to restock so your production never stops.
            </p>
            <Card className="bg-red-50 border-red-100">
              <CardContent className="p-6 flex gap-4 items-center">
                <AlertTriangle className="w-8 h-8 text-red-500 shrink-0" />
                <div>
                  <h4 className="font-bold text-red-900">Preventing Bottlenecks</h4>
                  <p className="text-sm text-red-800">
                    Assign a "Minimum Required" to frequently used black and white threads. This is
                    the #1 cause of workshop delays!
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>
        </motion.div>

        <motion.div variants={ANIMATIONS.fadeInUp} className="space-y-6">
          <Card className="bg-ghana-gold/5 border-ghana-gold/20 overflow-hidden">
            <div className="bg-ghana-gold p-4 text-white font-bold flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Usage Tracking
            </div>
            <CardContent className="p-6 text-sm text-ghana-gold/80 font-medium">
              You can deduct inventory directly from an order page when a fabric is used. This keeps
              your records accurate without extra manual work.
            </CardContent>
          </Card>

          <Card className="border-2 border-primary/10 bg-primary/5">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-primary font-bold">
                <TrendingDown className="w-5 h-5" />
                Cost Optimization
              </div>
              <p className="text-sm text-muted-foreground text-primary/70 font-medium">
                Track how much you're spending on materials to better price your garments and
                increase your profit margins.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Footer CTA */}
      <motion.div variants={ANIMATIONS.fadeInUp} className="pt-8 border-t">
        <h3 className="text-xl font-bold font-heading mb-4 italic text-primary">
          Inventory Management Tools
        </h3>
        <p className="text-muted-foreground">
          Learn how to use <strong>QR Codes for Fabric Labels</strong> or join our{' '}
          <strong>Bulk Sourcing Network</strong>.
        </p>
      </motion.div>
    </motion.div>
  );
}
