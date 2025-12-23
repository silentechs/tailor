'use client';

import { motion } from 'framer-motion';
import { Bell, Lock, Settings } from 'lucide-react';
import { ANIMATIONS } from '@/lib/design-system';

export default function SettingsHelpPage() {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={ANIMATIONS.staggerContainer}
      className="space-y-12"
    >
      <motion.div variants={ANIMATIONS.fadeInUp} className="space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-ghana-gold/10 flex items-center justify-center text-ghana-gold mb-6">
          <Settings className="w-8 h-8" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black font-heading">Account Settings</h1>
        <p className="text-xl text-muted-foreground max-w-3xl">
          Manage your personal preferences, security, and notification settings.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-8">
        <motion.div variants={ANIMATIONS.fadeInUp} className="space-y-6">
          <h2 className="text-2xl font-bold font-heading flex items-center gap-2 text-ghana-gold">
            <Lock className="w-6 h-6" />
            Security & Password
          </h2>
          <p className="text-muted-foreground">
            Keep your account secure by updating your password regularly and ensuring your workshop
            credentials are protected.
          </p>
        </motion.div>

        <motion.div variants={ANIMATIONS.fadeInUp} className="space-y-6">
          <h2 className="text-2xl font-bold font-heading flex items-center gap-2 text-ghana-gold">
            <Bell className="w-6 h-6" />
            Notifications
          </h2>
          <p className="text-muted-foreground">
            Configure how and when you want to be notified about new orders, payment updates, or
            client messages.
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
