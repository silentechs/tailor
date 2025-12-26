'use client';

import { motion } from 'framer-motion';
import { Bell, MessageCircle, MessageSquare, Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ANIMATIONS } from '@/lib/design-system';

export default function MessagesHelpPage() {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={ANIMATIONS.staggerContainer}
      className="space-y-12"
    >
      <motion.div variants={ANIMATIONS.fadeInUp} className="space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-ghana-gold/10 flex items-center justify-center text-ghana-gold mb-6">
          <MessageSquare className="w-8 h-8" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black font-heading text-white">
          Messaging & Alerts
        </h1>
        <p className="text-xl text-zinc-400 max-w-3xl">
          Direct communication with your artisans and real-time alerts for your orders.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-8">
        <motion.div variants={ANIMATIONS.fadeInUp} className="space-y-6">
          <h2 className="text-2xl font-bold font-heading flex items-center gap-2 text-white">
            <MessageCircle className="w-6 h-6 text-ghana-gold" />
            Direct Chat
          </h2>
          <p className="text-zinc-400">
            Message your designers directly within the portal to ask questions about your fit, send
            design changes, or coordinate fittings.
          </p>
        </motion.div>

        <motion.div variants={ANIMATIONS.fadeInUp} className="space-y-6">
          <h2 className="text-2xl font-bold font-heading flex items-center gap-2 text-white">
            <Bell className="w-6 h-6 text-ghana-gold" />
            Stay Updated
          </h2>
          <p className="text-zinc-400">
            Never miss an update. Enable browser or SMS notifications to be notified immediately
            when your designer sends a message or completes a stage of your order.
          </p>
        </motion.div>
      </div>

      <Card className="bg-primary/5 border-primary/10">
        <CardContent className="p-8 flex gap-6 items-start">
          <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-white">Privacy First</h4>
            <p className="text-sm text-zinc-500 font-medium">
              We protect your contact details. Communication through the portal is secure and
              ensures your personal number is only shared when you're ready.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
