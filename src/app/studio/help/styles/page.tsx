'use client';

import { motion } from 'framer-motion';
import { Heart, LogIn, Search, Star, UserPlus, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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

      {/* Auth-Aware Like Button Section */}
      <motion.div variants={ANIMATIONS.fadeInUp} className="space-y-6">
        <h2 className="text-2xl font-bold font-heading flex items-center gap-2 text-white">
          <Heart className="w-6 h-6 text-ghana-red" />
          How the Like Button Works
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-white font-bold">
                <LogIn className="w-5 h-5 text-ghana-gold" />
                Not Signed In?
              </div>
              <p className="text-sm text-zinc-400">
                When you tap the heart icon without being signed in, you'll see a friendly popover with options to <strong className="text-white">Sign In</strong> or <strong className="text-white">Create Account</strong>. Your likes will be saved once you're logged in.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-white font-bold">
                <UserPlus className="w-5 h-5 text-ghana-gold" />
                Already a Member?
              </div>
              <p className="text-sm text-zinc-400">
                Signed-in clients can instantly like designs—the heart fills up and the design is added to your personal wishlist for easy reference.
              </p>
            </CardContent>
          </Card>
        </div>
      </motion.div>

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
