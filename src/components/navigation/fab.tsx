'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { FileText, Plus, Scissors, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ANIMATIONS } from '@/lib/design-system';

export function FAB() {
  const [open, setOpen] = useState(false);

  const actions = [
    { name: 'New Order', icon: Scissors, href: '/dashboard/orders/new' },
    { name: 'New Client', icon: UserPlus, href: '/dashboard/clients/new' },
    { name: 'New Invoice', icon: FileText, href: '/dashboard/invoices/new' },
  ];

  return (
    <div className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-40 flex flex-col items-end gap-4 no-print">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-end gap-3 mb-2"
          >
            {actions.map((action, index) => (
              <motion.div
                key={action.name}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-2"
              >
                <span className="bg-card text-card-foreground px-2 py-1 rounded-md shadow-sm text-sm font-medium">
                  {action.name}
                </span>
                <Button
                  size="icon"
                  variant="secondary"
                  className="rounded-full shadow-lg h-10 w-10"
                  asChild
                >
                  <Link href={action.href}>
                    <action.icon className="h-5 w-5" />
                  </Link>
                </Button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen(!open)}
        className="bg-primary text-primary-foreground rounded-full p-4 shadow-xl flex items-center justify-center"
        whileHover={ANIMATIONS.cardHover}
        whileTap={{ scale: 0.9 }}
        animate={{ rotate: open ? 45 : 0 }}
      >
        <Plus className="h-6 w-6" />
      </motion.button>
    </div>
  );
}
