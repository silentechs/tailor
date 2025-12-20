'use client';

import { motion } from 'framer-motion';
import { GHANA_COLORS } from '@/lib/design-system';

export function KenteBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
      {/* Dynamic Gradient Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
          y: [0, 30, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full blur-[120px] bg-primary/10"
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          x: [0, -40, 0],
          y: [0, 60, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        className="absolute top-[20%] -right-[5%] w-[35%] h-[35%] rounded-full blur-[100px] bg-ghana-gold/15"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          x: [0, 30, 0],
          y: [0, -50, 0],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
        className="absolute -bottom-[10%] left-[20%] w-[45%] h-[45%] rounded-full blur-[130px] bg-ghana-red/10"
      />

      {/* Subtle Kente Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, ${GHANA_COLORS.gold} 0, ${GHANA_COLORS.gold} 1px, transparent 0, transparent 50%)`,
          backgroundSize: '40px 40px',
        }}
      />
    </div>
  );
}
