'use client';

import { motion } from 'framer-motion';
import { Shield, UserPlus, Users } from 'lucide-react';
import { ANIMATIONS } from '@/lib/design-system';

export default function TeamHelpPage() {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={ANIMATIONS.staggerContainer}
      className="space-y-12"
    >
      <motion.div variants={ANIMATIONS.fadeInUp} className="space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
          <Users className="w-8 h-8" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black font-heading">Team & Permissions</h1>
        <p className="text-xl text-muted-foreground max-w-3xl">
          Collaborate with your staff and manage their access levels within the workshop.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-8">
        <motion.div variants={ANIMATIONS.fadeInUp} className="space-y-6">
          <h2 className="text-2xl font-bold font-heading flex items-center gap-2 text-primary">
            <UserPlus className="w-6 h-6" />
            Inviting Workers
          </h2>
          <p className="text-muted-foreground">
            Invite your tailors, apprentices, and managers to join your workshop profile. You can
            assign specific roles to control what they can see and do.
          </p>
        </motion.div>

        <motion.div variants={ANIMATIONS.fadeInUp} className="space-y-6">
          <h2 className="text-2xl font-bold font-heading flex items-center gap-2 text-primary">
            <Shield className="w-6 h-6" />
            Role-Based Access
          </h2>
          <p className="text-muted-foreground">
            From 'Manager' to 'Apprentice', ensure every team member has the right level of access
            to keep your workshop secure and organized.
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
