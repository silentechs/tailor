'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function Navbar() {
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md"
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="relative h-8 w-8 overflow-hidden rounded-lg">
            <img src="/icon.png" alt="StitchCraft Logo" className="h-full w-full object-cover" />
          </div>
          <span className="text-xl font-bold font-heading tracking-tight">
            Stitch<span className="text-primary">Craft</span>
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/#features"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Features
          </Link>
          <Link
            href="/gallery"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Gallery
          </Link>
          <Link
            href="/discover"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Find a Tailor
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild className="hidden sm:flex">
            <Link href="/auth/login">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/auth/register">Get Started</Link>
          </Button>
        </div>
      </div>
    </motion.header>
  );
}
