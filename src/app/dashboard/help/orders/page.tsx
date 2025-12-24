'use client';

import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Clock, FileText, Layers, Ruler, Scissors, Users, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ANIMATIONS } from '@/lib/design-system';

export default function OrdersHelpPage() {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={ANIMATIONS.staggerContainer}
      className="space-y-12"
    >
      {/* Hero */}
      <motion.div variants={ANIMATIONS.fadeInUp} className="space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
          <FileText className="w-8 h-8" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black font-heading">Order Management</h1>
        <p className="text-xl text-muted-foreground max-w-3xl">
          Learn how to streamline your workshop operations, from initial consultation to final
          delivery.
        </p>
      </motion.div>

      {/* Sections */}
      <div className="grid lg:grid-cols-3 gap-8">
        <motion.div variants={ANIMATIONS.fadeInUp} className="lg:col-span-2 space-y-8">
          <section className="space-y-6">
            <h2 className="text-2xl font-bold font-heading flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm">
                1
              </span>
              Creating a New Order
            </h2>
            <div className="prose prose-slate max-w-none text-muted-foreground">
              <p>
                To create a new order, navigate to the <strong>Orders</strong> section and click the{' '}
                <strong>New Order</strong> button. You'll be guided through selecting a client,
                picking a design, and recording specific order details.
              </p>
              <ul className="space-y-2 list-none pl-0">
                <li className="flex gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  <span>
                    <strong>Select Client:</strong> Choose an existing client or add a new one on
                    the fly.
                  </span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  <span>
                    <strong>Pick Design:</strong> Select from your style collection or describe a
                    custom design.
                  </span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  <span>
                    <strong>Order Details:</strong> Add fabric type, priority, and special
                    instructions.
                  </span>
                </li>
              </ul>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold font-heading flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm">
                2
              </span>
              Tracking Progress
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  title: 'Draft',
                  icon: Clock,
                  desc: 'Initial details recorded, awaiting measurement sync.',
                },
                {
                  title: 'In Production',
                  icon: Scissors,
                  desc: 'Cutting and sewing has started in the workshop.',
                },
                {
                  title: 'Fitting',
                  icon: Users,
                  desc: 'Garment is ready for the first client fitting.',
                },
                {
                  title: 'Completed',
                  icon: CheckCircle2,
                  desc: 'Order finished and ready for pickup/delivery.',
                },
              ].map((status) => (
                <Card
                  key={status.title}
                  className="border-2 border-primary/5 hover:border-primary/20 transition-colors"
                >
                  <CardContent className="p-4 flex gap-4 items-start">
                    <div className="h-10 w-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary shrink-0">
                      <status.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold">{status.title}</h4>
                      <p className="text-sm text-muted-foreground">{status.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </motion.div>

        <motion.div variants={ANIMATIONS.fadeInUp} className="space-y-6">
          <Card className="bg-ghana-gold/5 border-ghana-gold/20 overflow-hidden">
            <div className="bg-ghana-gold p-4 text-white font-bold flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Pro Tip
            </div>
            <CardContent className="p-6 text-sm text-ghana-gold/80 font-medium">
              Use the <strong>Priority</strong> flag for orders with tight deadlines. These will be
              highlighted in your workshop list so your team knows what to focus on first.
            </CardContent>
          </Card>

          <Card className="border-2 border-red-100">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-red-600 font-bold">
                <AlertCircle className="w-5 h-5" />
                Wait!
              </div>
              <p className="text-sm text-muted-foreground">
                Before starting an order, always double-check if the client's measurements are up to
                date. You can sync them directly from their profile.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bulk Orders Section */}
      <motion.div variants={ANIMATIONS.fadeInUp} className="space-y-6">
        <h2 className="text-2xl font-bold font-heading flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm">
            3
          </span>
          Bulk Order Wizard
        </h2>
        <p className="text-muted-foreground">
          Need to create orders for an entire wedding party or corporate uniforms? The <strong>Bulk Order Wizard</strong> streamlines the process.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <Card className="border-2 border-primary/10">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                <span className="font-bold">Multi-Client Orders</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Add multiple clients in one go—perfect for group events like weddings, graduations, or corporate functions.
              </p>
            </CardContent>
          </Card>
          <Card className="border-2 border-ghana-gold/10">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Ruler className="w-5 h-5 text-ghana-gold" />
                <span className="font-bold">Measurement Templates</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Select from pre-defined templates (e.g., Agbada, Kaftan, Dress) to auto-populate the required measurement fields.
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 space-y-4 shadow-sm">
          <h4 className="font-bold text-slate-900">How to use Bulk Order Wizard:</h4>
          <ol className="space-y-2 text-muted-foreground">
            <li>Navigate to <strong>Orders → Bulk Order</strong> from the sidebar.</li>
            <li>Add clients one by one or import from your existing client list.</li>
            <li>For each client, select a <strong>Measurement Template</strong> to pre-load the required fields.</li>
            <li>Fill in measurements—the template ensures you don't miss any critical dimensions.</li>
            <li>Review all orders and submit in batch.</li>
          </ol>
        </div>
      </motion.div>

      {/* Footer CTA */}
      <motion.div variants={ANIMATIONS.fadeInUp} className="pt-8 border-t">
        <h3 className="text-xl font-bold font-heading mb-4 italic text-primary">
          Need more help with orders?
        </h3>
        <p className="text-muted-foreground">
          Check out our video tutorial on{' '}
          <span className="text-primary hover:underline cursor-pointer">
            Advanced Order Workflows
          </span>{' '}
          or contact our workshop specialists.
        </p>
      </motion.div>
    </motion.div>
  );
}
