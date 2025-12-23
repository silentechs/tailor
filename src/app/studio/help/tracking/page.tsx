'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Clock, MapPin, Scissors, ShoppingBag, Users, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ANIMATIONS } from '@/lib/design-system';

export default function TrackingHelpPage() {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={ANIMATIONS.staggerContainer}
      className="space-y-12"
    >
      <motion.div variants={ANIMATIONS.fadeInUp} className="space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-ghana-gold/10 flex items-center justify-center text-ghana-gold mb-6">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black font-heading text-white">
          Tracking Your Orders
        </h1>
        <p className="text-xl text-zinc-400 max-w-3xl">
          Follow your garment's journey from the first cut to the final fitting.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        <motion.div variants={ANIMATIONS.fadeInUp} className="lg:col-span-2 space-y-8">
          <section className="space-y-6">
            <h2 className="text-2xl font-bold font-heading flex items-center gap-2 text-white">
              <MapPin className="w-6 h-6 text-ghana-gold" />
              The Live Timeline
            </h2>
            <p className="text-zinc-400">
              Every order you place with a StitchCraft workshop comes with a private tracking
              portal. You can see real-time updates as your tailor works on your piece.
            </p>
            <div className="space-y-4">
              {[
                {
                  title: 'Draft',
                  desc: 'Order placed, workshop is preparing fabrics.',
                  icon: Clock,
                },
                {
                  title: 'In Production',
                  desc: 'Tailors have begun cutting and sewing.',
                  icon: Scissors,
                },
                {
                  title: 'Ready for Fitting',
                  desc: 'Your garment is ready for your first try-on.',
                  icon: Users,
                },
                {
                  title: 'Completed',
                  desc: 'Finished and ready for pickup or delivery.',
                  icon: CheckCircle2,
                },
              ].map((status, _i) => (
                <div
                  key={status.title}
                  className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5"
                >
                  <div className="h-10 w-10 rounded-xl bg-ghana-gold/10 flex items-center justify-center text-ghana-gold shrink-0">
                    <status.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">{status.title}</h4>
                    <p className="text-sm text-zinc-400">{status.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </motion.div>

        <motion.div variants={ANIMATIONS.fadeInUp} className="space-y-6">
          <Card className="bg-primary/10 border-primary/20">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-primary font-bold">
                <Zap className="w-5 h-5" />
                Live Alerts
              </div>
              <p className="text-sm text-zinc-400">
                You'll receive email or SMS notifications (if enabled) whenever your order hits a
                major milestone.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
