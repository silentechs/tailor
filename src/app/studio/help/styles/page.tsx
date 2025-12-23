'use client';

import { motion } from 'framer-motion';
import { Heart, Search, Star, Zap } from 'lucide-react';
import { ANIMATIONS } from '@/lib/design-system';

export default function StylesHelpPage() {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={ANIMATIONS.staggerContainer}
      className="space-y-12"
    >
      <motion.div variants={ANIMATIONS.fadeInUp} className="space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-ghana-gold/10 flex items-center justify-center text-ghana-gold mb-6">
          <Star className="w-8 h-8" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black font-heading text-white">The Style Hub</h1>
        <p className="text-xl text-zinc-400 max-w-3xl">
          Discover a world of bespoke fashion and save your favorite inspirations.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-8">
        <motion.div variants={ANIMATIONS.fadeInUp} className="space-y-6">
          <h2 className="text-2xl font-bold font-heading flex items-center gap-2 text-white">
            <Search className="w-6 h-6 text-ghana-gold" />
            Finding Inspiration
          </h2>
          <p className="text-zinc-400">
            Browse the latest collections from top tailors across the country. Filter by garment
            type, fabric, or occasion to find exactly what you're looking for.
          </p>
        </motion.div>

        <motion.div variants={ANIMATIONS.fadeInUp} className="space-y-6">
          <h2 className="text-2xl font-bold font-heading flex items-center gap-2 text-white">
            <Heart className="w-6 h-6 text-ghana-gold" />
            Saving Favorites
          </h2>
          <p className="text-zinc-400">
            Click the heart icon on any design to save it to your personal favorites. You can easily
            share these with your tailor when starting a new order.
          </p>
        </motion.div>
      </div>

      <motion.div
        variants={ANIMATIONS.fadeInUp}
        className="bg-primary/5 rounded-[2.5rem] p-8 border border-primary/10"
      >
        <div className="flex items-center gap-4 text-primary font-bold mb-4">
          <Zap className="w-5 h-5" />
          Style Tip
        </div>
        <p className="text-zinc-400 text-sm italic">
          Use the **Style Hub** to communicate with your tailor. Showing them exactly what you like
          visually is the best way to ensure your final garment meets your expectations.
        </p>
      </motion.div>
    </motion.div>
  );
}
