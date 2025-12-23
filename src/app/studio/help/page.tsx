'use client';

import { motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  HelpCircle,
  History,
  MessageSquare,
  Palette,
  Ruler,
  Search,
  ShoppingBag,
  Star,
  Zap,
} from 'lucide-react';
import { HelpCard } from '@/components/help/HelpCard';
import { Input } from '@/components/ui/input';
import { ANIMATIONS } from '@/lib/design-system';

const STUDIO_HELP_CATEGORIES = [
  {
    title: 'Welcome to Studio',
    description: 'Learn how to navigate your person fashion portal and track your garments.',
    icon: Zap,
    href: '/studio/help/welcome',
    color: 'gold' as const,
  },
  {
    title: 'Tracking Orders',
    description: 'See exactly where your clothes are in the workshop with live updates.',
    icon: ShoppingBag,
    href: '/studio/help/tracking',
    color: 'primary' as const,
  },
  {
    title: 'My Measurements',
    description: 'Understand how measurements are stored and shared with workshops.',
    icon: Ruler,
    href: '/studio/help/measurements',
    color: 'red' as const,
  },
  {
    title: 'Style Hub',
    description: 'Save inspirations and build your digital fashion gallery.',
    icon: Star,
    href: '/studio/help/styles',
    color: 'gold' as const,
  },
  {
    title: 'Design Library',
    description: 'Explore and manage your personal garment designs and sketches.',
    icon: Palette,
    href: '/studio/help/designs',
    color: 'primary' as const,
  },
  {
    title: 'Payment History',
    description: 'Keep track of your deposits, balances, and digital invoices.',
    icon: History,
    href: '/studio/help/payments',
    color: 'red' as const,
  },
  {
    title: 'Messaging',
    description: 'Communicate directly with your tailors and receive status alerts.',
    icon: MessageSquare,
    href: '/studio/help/messages',
    color: 'gold' as const,
  },
];

export default function StudioHelpPage() {
  return (
    <div className="space-y-12 pb-16">
      {/* Header Section */}
      <motion.div
        initial="initial"
        animate="animate"
        variants={ANIMATIONS.fadeInUp}
        className="text-center max-w-3xl mx-auto space-y-6"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-ghana-gold/10 text-ghana-gold border border-ghana-gold/20 text-sm font-bold uppercase tracking-wider">
          <BookOpen className="w-4 h-4" />
          <span>Studio Guide</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black font-heading tracking-tight text-white">
          Client <span className="text-ghana-gold italic">Support</span> Hub
        </h1>
        <p className="text-xl text-zinc-400 font-medium">
          Everything you need to manage your bespoke fashion journey with StitchCraft.
        </p>

        {/* Search Bar */}
        <div className="relative max-w-xl mx-auto mt-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <Input
            placeholder="Search for guides or features..."
            className="pl-12 h-14 rounded-2xl bg-white/5 border-white/10 focus-visible:ring-ghana-gold shadow-sm text-lg text-white placeholder:text-zinc-600"
          />
        </div>
      </motion.div>

      {/* Grid Section */}
      <motion.div
        initial="initial"
        animate="animate"
        variants={ANIMATIONS.staggerContainer}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {STUDIO_HELP_CATEGORIES.map((category) => (
          <motion.div key={category.title} variants={ANIMATIONS.fadeInUp}>
            <HelpCard
              {...category}
              className="bg-white/5 border-white/5 hover:bg-white/10 text-white"
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Support Section */}
      <motion.div
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        variants={ANIMATIONS.fadeInUp}
        className="bg-white/5 rounded-[2.5rem] p-8 md:p-12 text-center space-y-6 border border-white/5"
      >
        <div className="w-16 h-16 bg-ghana-gold rounded-2xl flex items-center justify-center mx-auto shadow-lg">
          <HelpCircle className="w-8 h-8 text-ghana-black" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-heading text-white">Need a human?</h2>
          <p className="text-zinc-400 max-w-lg mx-auto">
            If you're having trouble with an order or account, our support team is ready to assist
            you.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="mailto:support@silentech.live"
            className="inline-flex items-center gap-2 px-8 py-4 bg-ghana-gold text-ghana-black rounded-2xl font-black hover:scale-105 transition-transform shadow-xl"
          >
            Contact Support Team
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </motion.div>
    </div>
  );
}
