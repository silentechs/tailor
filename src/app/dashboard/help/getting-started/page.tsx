'use client';

import { motion } from 'framer-motion';
import { Heart, Rocket, ShieldCheck, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ANIMATIONS } from '@/lib/design-system';

export default function GettingStartedHelpPage() {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={ANIMATIONS.staggerContainer}
      className="space-y-12"
    >
      <motion.div variants={ANIMATIONS.fadeInUp} className="space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-ghana-gold/10 flex items-center justify-center text-ghana-gold mb-6">
          <Rocket className="w-8 h-8" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black font-heading">Getting Started</h1>
        <p className="text-xl text-muted-foreground max-w-3xl">
          Welcome to StitchCraft! Let's get your workshop set up for success in three simple steps.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        {[
          {
            step: '1',
            title: 'Complete Profile',
            icon: ShieldCheck,
            desc: 'Add your business name, location, and contact details so clients can find you.',
            color: 'gold',
          },
          {
            step: '2',
            title: 'Add Your First Client',
            icon: Heart,
            desc: 'Record a client and their measurements to see how the sync works.',
            color: 'primary',
          },
          {
            step: '3',
            title: 'Create Your First Order',
            icon: Star,
            desc: 'Start tracking production and give your clients the live experience.',
            color: 'red',
          },
        ].map((item) => (
          <motion.div key={item.step} variants={ANIMATIONS.fadeInUp}>
            <Card className="h-full border-2 border-slate-100 hover:border-primary/20 transition-all">
              <CardContent className="p-8 space-y-4 text-center">
                <div
                  className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center font-bold bg-slate-100 text-slate-900 mb-4`}
                >
                  {item.step}
                </div>
                <item.icon className="w-12 h-12 mx-auto text-primary" />
                <h3 className="text-xl font-bold font-heading">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
