'use client';

import { motion } from 'framer-motion';
import { BookOpen, FileText, Layers, Palette } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ANIMATIONS } from '@/lib/design-system';

export default function DesignsHelpPage() {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={ANIMATIONS.staggerContainer}
      className="space-y-12"
    >
      <motion.div variants={ANIMATIONS.fadeInUp} className="space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
          <Palette className="w-8 h-8" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black font-heading text-white">
          Your Design Library
        </h1>
        <p className="text-xl text-zinc-400 max-w-3xl">
          Manage your personal collection of designs, sketches, and detailed garment specs.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        <motion.div variants={ANIMATIONS.fadeInUp} className="lg:col-span-2 space-y-8">
          <section className="space-y-6">
            <h2 className="text-2xl font-bold font-heading flex items-center gap-2 text-white">
              <FileText className="w-6 h-6 text-primary" />
              Custom Commissions
            </h2>
            <p className="text-zinc-400">
              Your design library stores every custom creation you've worked on with your tailors.
              Review past sketches, fabric choices, and specific details.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold font-heading flex items-center gap-2 text-white">
              <Layers className="w-6 h-6 text-primary" />
              Organizing Your Wardrobe
            </h2>
            <p className="text-zinc-400">
              Group your designs by season, occasion (e.g., Wedding, Corporate), or garment type to
              keep your digital wardrobe organized.
            </p>
          </section>
        </motion.div>

        <motion.div variants={ANIMATIONS.fadeInUp} className="space-y-6">
          <Card className="bg-white/5 border-white/5">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-primary font-bold">
                <BookOpen className="w-5 h-5" />
                History
              </div>
              <p className="text-sm text-zinc-500">
                Found a design you love from 2 years ago? Every design is archived with its original
                specs and the tailor who made it.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
