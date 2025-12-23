'use client';

import { motion } from 'framer-motion';
import { ChevronLeft, Home } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMainPage = pathname === '/dashboard/help';

  return (
    <div className="max-w-6xl mx-auto">
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
            className="rounded-xl gap-2 text-muted-foreground hover:text-primary"
          >
            <Link href="/dashboard/help">
              <ChevronLeft className="w-4 h-4" />
              Back to Help Center
            </Link>
          </Button>
          <div className="h-4 w-px bg-border" />
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="rounded-xl gap-2 text-muted-foreground hover:text-primary"
          >
            <Link href="/dashboard/business">
              <Home className="w-4 h-4" />
              Dashboard
            </Link>
          </Button>
        </motion.div>
      )}

      <main className="min-h-screen">{children}</main>
    </div>
  );
}
