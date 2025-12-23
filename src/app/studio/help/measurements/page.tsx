'use client';

import { motion } from 'framer-motion';
import { Globe, Heart, RefreshCcw, Ruler, Scissors, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ANIMATIONS } from '@/lib/design-system';

export default function MeasurementsHelpPage() {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={ANIMATIONS.staggerContainer}
      className="space-y-12"
    >
      <motion.div variants={ANIMATIONS.fadeInUp} className="space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-ghana-red/10 flex items-center justify-center text-ghana-red mb-6">
          <Ruler className="w-8 h-8" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black font-heading text-white">
          Your Measurements
        </h1>
        <p className="text-xl text-zinc-400 max-w-3xl">
          One profile for every workshop in Ghana. Sync your fit once, wear it everywhere.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        <motion.div variants={ANIMATIONS.fadeInUp} className="lg:col-span-2 space-y-8">
          <section className="space-y-6">
            <h2 className="text-2xl font-bold font-heading flex items-center gap-2 text-white">
              <Globe className="w-6 h-6 text-ghana-red" />
              The StitchCraft Global Sync
            </h2>
            <p className="text-zinc-400">
              When you get measured at a StitchCraft workshop, you can ask your tailor to{' '}
              <strong>Sync to Profile</strong>. This saves your exact measurements to your private
              Studio vault.
            </p>
            <div className="bg-white/5 p-6 rounded-2xl border border-white/5 space-y-4">
              <h4 className="font-bold text-white">Why sync?</h4>
              <ul className="space-y-3">
                <li className="flex gap-2">
                  <ShieldCheck className="w-5 h-5 text-ghana-red shrink-0" />
                  <span className="text-zinc-300">
                    <strong>Privacy:</strong> You control who sees your data.
                  </span>
                </li>
                <li className="flex gap-2">
                  <RefreshCcw className="w-5 h-5 text-ghana-red shrink-0" />
                  <span className="text-zinc-300">
                    <strong>Portability:</strong> New tailors can sync your measurements instantly.
                  </span>
                </li>
                <li className="flex gap-2">
                  <Scissors className="w-5 h-5 text-ghana-red shrink-0" />
                  <span className="text-zinc-300">
                    <strong>Consistency:</strong> Maintain the same perfect fit across different
                    artisans.
                  </span>
                </li>
              </ul>
            </div>
          </section>
        </motion.div>

        <motion.div variants={ANIMATIONS.fadeInUp} className="space-y-6">
          <Card className="bg-ghana-gold/10 border-ghana-gold/20">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-ghana-gold font-bold">
                <Heart className="w-5 h-5" />
                Expert Tip
              </div>
              <p className="text-sm text-zinc-400">
                Update your measurements at least once a year or if you've had a significant
                lifestyle change. This ensures every garment is a masterpiece.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
