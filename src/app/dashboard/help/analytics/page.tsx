'use client';

import { motion } from 'framer-motion';
import { BarChart, Target, TrendingUp } from 'lucide-react';
import { ANIMATIONS } from '@/lib/design-system';

export default function AnalyticsHelpPage() {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={ANIMATIONS.staggerContainer}
      className="space-y-12"
    >
      <motion.div variants={ANIMATIONS.fadeInUp} className="space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
          <BarChart className="w-8 h-8" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black font-heading">Analytics & Growth</h1>
        <p className="text-xl text-muted-foreground max-w-3xl">
          Unlock insights into your business performance and make data-driven decisions to scale.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-8">
        <motion.div variants={ANIMATIONS.fadeInUp} className="space-y-6">
          <h2 className="text-2xl font-bold font-heading flex items-center gap-2 text-primary">
            <TrendingUp className="w-6 h-6" />
            Revenue Tracking
          </h2>
          <p className="text-muted-foreground">
            Monitor your monthly revenue, identify high-value months, and track your business growth
            over time.
          </p>
        </motion.div>

        <motion.div variants={ANIMATIONS.fadeInUp} className="space-y-6">
          <h2 className="text-2xl font-bold font-heading flex items-center gap-2 text-primary">
            <Target className="w-6 h-6" />
            Order Volume
          </h2>
          <p className="text-muted-foreground">
            Understand how many orders you're processing and which garment types are most popular
            among your clients.
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
