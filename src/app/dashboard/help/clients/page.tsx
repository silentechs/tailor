'use client';

import { motion } from 'framer-motion';
import { Globe, Heart, RefreshCcw, UserPlus, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ANIMATIONS } from '@/lib/design-system';

export default function ClientsHelpPage() {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={ANIMATIONS.staggerContainer}
      className="space-y-12"
    >
      {/* Hero */}
      <motion.div variants={ANIMATIONS.fadeInUp} className="space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-ghana-red/10 flex items-center justify-center text-ghana-red mb-6">
          <Users className="w-8 h-8" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black font-heading">Client Management</h1>
        <p className="text-xl text-muted-foreground max-w-3xl">
          Everything you need to know about managing your clients and their measurements.
        </p>
      </motion.div>

      {/* Sections */}
      <div className="grid lg:grid-cols-3 gap-8">
        <motion.div variants={ANIMATIONS.fadeInUp} className="lg:col-span-2 space-y-8">
          <section className="space-y-6">
            <h2 className="text-2xl font-bold font-heading flex items-center gap-2 text-ghana-red">
              <UserPlus className="w-6 h-6" />
              Building Your Client List
            </h2>
            <div className="prose prose-slate max-w-none text-muted-foreground">
              <p>
                A well-managed client list is the heart of your fashion house. Adding clients to
                StitchCraft allows you to keep track of their style preferences and historical
                orders.
              </p>
              <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 space-y-4 shadow-sm">
                <h4 className="font-bold text-slate-900">How to add a client:</h4>
                <ol className="space-y-2">
                  <li>
                    Go to the <strong>Clients</strong> page from the sidebar.
                  </li>
                  <li>
                    Click <strong>Add Client</strong> in the top right.
                  </li>
                  <li>Enter their name, phone number, and any initial notes.</li>
                  <li>(Recommended) Add their measurements immediately after creation.</li>
                </ol>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold font-heading flex items-center gap-2 text-ghana-red">
              <RefreshCcw className="w-6 h-6" />
              The Measurement Sync
            </h2>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                StitchCraft's unique <strong>Global Sync</strong> feature allows you to sync
                measurements between your workshop records and the client's public StitchCraft
                profile.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <Card className="border-2 border-primary/10">
                  <CardContent className="p-4 space-y-2">
                    <Badge className="bg-primary/20 text-primary border-none">
                      Push to Profile
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      Updates the client's private record with the latest workshop measurements.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-2 border-ghana-gold/10">
                  <CardContent className="p-4 space-y-2">
                    <Badge className="bg-ghana-gold/20 text-ghana-gold border-none">
                      Sync from Profile
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      Fetches the latest measurements recorded by the client or another workshop.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
        </motion.div>

        <motion.div variants={ANIMATIONS.fadeInUp} className="space-y-6">
          <Card className="bg-primary/5 border-primary/20 overflow-hidden">
            <div className="bg-primary p-4 text-white font-bold flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Global Profiles
            </div>
            <CardContent className="p-6 text-sm text-primary/80 font-medium">
              If a client has their own StitchCraft account, you can link them by their phone
              number. This enables seamless measurement sharing and order tracking!
            </CardContent>
          </Card>

          <Card className="border-2 border-ghana-gold/10 bg-ghana-gold/5">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-ghana-gold font-bold">
                <Heart className="w-5 h-5" />
                Loyalty & History
              </div>
              <p className="text-sm text-muted-foreground text-ghana-gold/70 font-medium">
                Keep notes on client preferences—favorite fabrics, preferred necklines, or sizing
                quirks. This data stays with the client file for every future order.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Footer CTA */}
      <motion.div variants={ANIMATIONS.fadeInUp} className="pt-8 border-t">
        <h3 className="text-xl font-bold font-heading mb-4 italic text-ghana-red">
          Client Management Tips
        </h3>
        <p className="text-muted-foreground">
          Want to learn more? Read our guide on <strong>Managing Large Bridal Parties</strong> or
          learn more about <strong>Measurement Privacy</strong>.
        </p>
      </motion.div>
    </motion.div>
  );
}
