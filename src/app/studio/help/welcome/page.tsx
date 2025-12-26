'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Rocket, Star, Zap } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { ANIMATIONS } from '@/lib/design-system';

export default function WelcomeHelpPage() {
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
        <h1 className="text-4xl md:text-5xl font-black font-heading text-white">
          Welcome to your Studio
        </h1>
        <p className="text-xl text-zinc-400 max-w-3xl">
          Your private portal for bespoke fashion. Track orders, manage measurements, and explore
          styles.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        {[
          {
            step: '1',
            title: 'Track Orders',
            icon: Zap,
            desc: 'Stay updated with live workshop progress on every garment.',
            href: '/studio/orders',
          },
          {
            step: '2',
            title: 'Your Measurements',
            icon: Ruler,
            desc: 'Securely store and share your fit with any StitchCraft workshop.',
            href: '/studio/measurements',
          },
          {
            step: '3',
            title: 'Discover Styles',
            icon: Star,
            desc: 'Find inspiration and save your favorite designs from the Style Hub.',
            href: '/studio/styles',
          },
        ].map((item) => (
          <motion.div key={item.step} variants={ANIMATIONS.fadeInUp}>
            <Link href={item.href}>
              <Card className="h-full bg-white/5 border-white/5 hover:border-ghana-gold/20 transition-all group">
                <CardContent className="p-8 space-y-4 text-center">
                  <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center font-bold bg-white/10 text-white mb-4 group-hover:bg-ghana-gold group-hover:text-ghana-black transition-colors">
                    {item.step}
                  </div>
                  <item.icon className="w-12 h-12 mx-auto text-ghana-gold" />
                  <h3 className="text-xl font-bold font-heading text-white">{item.title}</h3>
                  <p className="text-zinc-400 text-sm">{item.desc}</p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      <motion.div
        variants={ANIMATIONS.fadeInUp}
        className="bg-white/5 rounded-[2.5rem] p-8 md:p-12 border border-white/5"
      >
        <div className="flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-black font-heading text-white italic">
              Ready to explore?
            </h2>
            <p className="text-zinc-400">
              Your Studio is the central hub for your fashion life. Connect with designers, manage
              your wardrobe, and never worry about a bad fit again.
            </p>
          </div>
          <Link
            href="/studio"
            className="inline-flex items-center gap-2 px-8 py-4 bg-ghana-gold text-ghana-black rounded-2xl font-black hover:scale-105 transition-transform shadow-xl whitespace-nowrap"
          >
            Go to My Studio
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Missing import for Ruler in the loop
import { Ruler } from 'lucide-react';
