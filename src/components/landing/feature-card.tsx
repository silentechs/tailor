'use client';

import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { ANIMATIONS } from '@/lib/design-system';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color: 'primary' | 'gold' | 'red';
}

export function FeatureCard({ title, description, icon: Icon, color }: FeatureCardProps) {
  const colorMap = {
    primary: 'bg-primary/10 text-primary',
    gold: 'bg-ghana-gold/10 text-ghana-gold',
    red: 'bg-ghana-red/10 text-ghana-red',
  };

  return (
    <motion.div
      variants={ANIMATIONS.staggerItem}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="group relative p-8 rounded-2xl border bg-card hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
    >
      <div
        className={`h-14 w-14 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-300 ${colorMap[color]}`}
      >
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>

      {/* Subtle border shine effect */}
      <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-primary/10 pointer-events-none transition-colors duration-300" />
    </motion.div>
  );
}
