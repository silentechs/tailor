'use client';

import { motion } from 'framer-motion';
import { ChevronLeft, Home } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function StudioHelpLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMainPage = pathname === '/studio/help';

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {!isMainPage && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8 flex items-center gap-4"
        >
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="rounded-xl gap-2 text-zinc-400 hover:text-ghana-gold hover:bg-white/5"
          >
            <Link href="/studio/help">
              <ChevronLeft className="w-4 h-4" />
              Back to Studio Guide
            </Link>
          </Button>
          <div className="h-4 w-px bg-white/10" />
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="rounded-xl gap-2 text-zinc-400 hover:text-ghana-gold hover:bg-white/5"
          >
            <Link href="/studio">
              <Home className="w-4 h-4" />
              My Studio
            </Link>
          </Button>
        </motion.div>
      )}

      <main className="min-h-screen">{children}</main>
    </div>
  );
}
