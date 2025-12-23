'use client';

import { motion } from 'framer-motion';
import { Globe, Image as ImageIcon, Share2 } from 'lucide-react';
import { ANIMATIONS } from '@/lib/design-system';

export default function ShowcaseHelpPage() {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={ANIMATIONS.staggerContainer}
      className="space-y-12"
    >
      <motion.div variants={ANIMATIONS.fadeInUp} className="space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-ghana-red/10 flex items-center justify-center text-ghana-red mb-6">
          <Globe className="w-8 h-8" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black font-heading">Your Public Showcase</h1>
        <p className="text-xl text-muted-foreground max-w-3xl">
          Build a stunning digital presence and attract clients from across Ghana and the world.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        <motion.div variants={ANIMATIONS.fadeInUp} className="lg:col-span-2 space-y-8">
          <section className="space-y-6">
            <h2 className="text-2xl font-bold font-heading flex items-center gap-2 text-ghana-red">
              <ImageIcon className="w-6 h-6" />
              Building Your Portfolio
            </h2>
            <p className="text-muted-foreground">
              Upload high-quality photos of your best work. Every item in your portfolio can be
              shared directly on social media or with prospective clients.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold font-heading flex items-center gap-2 text-ghana-red">
              <Share2 className="w-6 h-6" />
              Attracting New Clients
            </h2>
            <p className="text-muted-foreground">
              Enable your <strong>Public Profile</strong> to appear in the StitchCraft Discover
              feed. This makes your workshop visible to thousands of potential clients looking for
              master tailors.
            </p>
          </section>
        </motion.div>
      </div>
    </motion.div>
  );
}
