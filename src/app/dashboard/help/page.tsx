'use client';

import { motion } from 'framer-motion';
import {
  BarChart,
  BookOpen,
  CreditCard,
  FileText,
  Globe,
  HelpCircle,
  Layers,
  MessageSquare,
  Scissors,
  Search,
  Settings,
  Zap,
} from 'lucide-react';
import { HelpCard } from '@/components/help/HelpCard';
import { Input } from '@/components/ui/input';
import { ANIMATIONS } from '@/lib/design-system';

const HELP_CATEGORIES = [
  {
    title: 'Getting Started',
    description: 'Learn the basics of StitchCraft and set up your workshop profile for success.',
    icon: Zap,
    href: '/dashboard/help/getting-started',
    color: 'gold' as const,
  },
  {
    title: 'Order Management',
    description: 'Create, track, and manage garment orders from first stitch to final fitting.',
    icon: FileText,
    href: '/dashboard/help/orders',
    color: 'primary' as const,
  },
  {
    title: 'Client Measurements',
    description: 'How to store measurements and sync them with client global profiles.',
    icon: Scissors,
    href: '/dashboard/help/clients',
    color: 'red' as const,
  },
  {
    title: 'Inventory & Tools',
    description: 'Keep track of your fabrics, threads, and shop equipment efficiently.',
    icon: Layers,
    href: '/dashboard/help/inventory',
    color: 'primary' as const,
  },
  {
    title: 'Payments & Invoices',
    description: 'Manage deposits, final payments, and generate professional invoices for clients.',
    icon: CreditCard,
    href: '/dashboard/help/finance',
    color: 'gold' as const,
  },
  {
    title: 'Analytics & Growth',
    description: 'Understand your business performance with clear metrics and reporting.',
    icon: BarChart,
    href: '/dashboard/help/analytics',
    color: 'primary' as const,
  },
  {
    title: 'Showcase & Portfolios',
    description: 'How to use your public profile to attract new clients and share your work.',
    icon: Globe,
    href: '/dashboard/help/showcase',
    color: 'red' as const,
  },
  {
    title: 'Team & Communications',
    description: 'Manage your staff, assign tasks, and communicate with clients effectively.',
    icon: MessageSquare,
    href: '/dashboard/help/team',
    color: 'primary' as const,
  },
  {
    title: 'Account Settings',
    description: 'Manage your personal settings, password, and workshop preferences.',
    icon: Settings,
    href: '/dashboard/help/settings',
    color: 'gold' as const,
  },
];

export default function HelpPage() {
  return (
    <div className="space-y-12 pb-16">
      {/* Header Section */}
      <motion.div
        initial="initial"
        animate="animate"
        variants={ANIMATIONS.fadeInUp}
        className="text-center max-w-3xl mx-auto space-y-6"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-bold uppercase tracking-wider">
          <BookOpen className="w-4 h-4" />
          <span>Knowledge Base</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black font-heading tracking-tight">
          How can we <span className="text-primary italic">help you</span> today?
        </h1>
        <p className="text-xl text-muted-foreground font-medium">
          Welcome to the StitchCraft Help Center. Everything you need to master your digital
          workshop and scale your fashion business.
        </p>

        {/* Search Bar - Aesthetic Placeholder for now */}
        <div className="relative max-w-xl mx-auto mt-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search for guides, features, or tips..."
            className="pl-12 h-14 rounded-2xl border-2 border-primary/10 focus-visible:ring-primary shadow-sm text-lg"
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
        {HELP_CATEGORIES.map((category, _idx) => (
          <motion.div key={category.title} variants={ANIMATIONS.fadeInUp}>
            <HelpCard {...category} />
          </motion.div>
        ))}
      </motion.div>

      {/* Support Section */}
      <motion.div
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        variants={ANIMATIONS.fadeInUp}
        className="bg-muted/50 rounded-[2.5rem] p-8 md:p-12 text-center space-y-6 border border-primary/5 shadow-inner"
      >
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <HelpCircle className="w-8 h-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-heading">Still need assistance?</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Our support team is always here to help you get the most out of StitchCraft. Reach out
            via WhatsApp or Email.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="https://wa.me/233209225268"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#25D366] text-white rounded-xl font-bold hover:bg-[#128C7E] transition-colors shadow-md"
          >
            <MessageSquare className="w-5 h-5" />
            WhatsApp Support
          </a>
          <a
            href="mailto:support@silentech.live"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-md"
          >
            <Globe className="w-5 h-5" />
            Email Support
          </a>
        </div>
      </motion.div>
    </div>
  );
}
