'use client';

import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Scissors, Smartphone, TrendingUp, Zap } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { FeatureCard } from '@/components/landing/feature-card';
import { KenteBackground } from '@/components/landing/kente-background';
import { Navbar } from '@/components/landing/navbar';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ANIMATIONS } from '@/lib/design-system';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
      <Navbar />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-20 pb-32 md:pt-32 md:pb-48">
          <KenteBackground />

          <div className="container mx-auto px-4 relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial="initial"
                animate="animate"
                variants={ANIMATIONS.staggerContainer}
                className="space-y-8"
              >
                <motion.div
                  variants={ANIMATIONS.fadeInUp}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20"
                >
                  <TrendingUp className="h-4 w-4" />
                  <span>The #1 Management Platform for Ghana Fashion</span>
                </motion.div>

                <motion.h1
                  variants={ANIMATIONS.fadeInUp}
                  className="text-5xl md:text-7xl font-bold font-heading tracking-tight leading-[1.1]"
                >
                  Empowering <br />
                  <span className="text-primary italic">Ghanaian Tailors</span> <br />
                  to Scale.
                </motion.h1>

                <motion.p
                  variants={ANIMATIONS.fadeInUp}
                  className="text-xl text-muted-foreground max-w-lg leading-relaxed"
                >
                  Transform your fashion business with a digital companion built specifically for
                  the Ghanaian tailoring workshop.
                </motion.p>

                <motion.div
                  variants={ANIMATIONS.fadeInUp}
                  className="flex flex-col sm:flex-row gap-4 pt-4"
                >
                  <Button
                    size="lg"
                    className="text-lg px-8 h-14 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
                    asChild
                  >
                    <Link href="/auth/register">
                      Start Your Journey <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg px-8 h-14 bg-background/50 backdrop-blur-sm"
                    asChild
                  >
                    <Link href="#features">See Features</Link>
                  </Button>
                </motion.div>

                <motion.div
                  variants={ANIMATIONS.fadeInUp}
                  className="flex items-center gap-6 pt-4 text-sm text-muted-foreground"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <span>Free Setup</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <span>Offline Ready</span>
                  </div>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-primary/20 blur-[100px] -z-10 rounded-full" />
                <div className="relative rounded-3xl overflow-hidden border-4 border-white shadow-2xl skew-y-1 hover:skew-y-0 transition-transform duration-500">
                  <Image
                    src="/images/landing/hero-mockup.png"
                    alt="StitchCraft Dashboard Mockup"
                    width={800}
                    height={600}
                    className="w-full h-auto object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                </div>

                {/* Floating Stats Card */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl border hidden md:block"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-[var(--color-ghana-gold)] rounded-full flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Monthly Orders</p>
                      <p className="text-2xl font-bold">+124% Growth</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Value Prop Section */}
        <section id="features" className="py-24 bg-muted/30 relative">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-20">
              <h2 className="text-3xl md:text-5xl font-bold font-heading mb-6 italic">
                Built for the Way You Work
              </h2>
              <p className="text-xl text-muted-foreground">
                From individual tailors to large fashion houses, StitchCraft provides the tools you
                need to stay organized and grow your revenue.
              </p>
            </div>

            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={ANIMATIONS.staggerContainer}
              className="grid md:grid-cols-3 gap-8"
            >
              <FeatureCard
                title="Smart Order Tracking"
                description="Monitor every stitch. From initial measurement to final collection, never lose track of a client's garment again."
                icon={Scissors}
                color="primary"
              />
              <FeatureCard
                title="Client Measurement Vault"
                description="Securely store detailed measurements for every client. Access them instantly on any device, even when offline."
                icon={Smartphone}
                color="gold"
              />
              <FeatureCard
                title="Business Intelligence"
                description="Gain insights into your top earners, busy seasons, and material inventory. Make decisions based on real data."
                icon={TrendingUp}
                color="red"
              />
            </motion.div>
          </div>
        </section>

        {/* How it Works */}
        <section id="how-it-works" className="py-24">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-12">
                <h2 className="text-3xl md:text-5xl font-bold font-heading">
                  Seamless Workflow, <span className="text-primary italic">Better Results</span>
                </h2>

                <div className="space-y-8">
                  <div className="flex gap-6">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                      1
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">Capture the Vision</h4>
                      <p className="text-muted-foreground text-lg">
                        Input client details and measurements using our intuitive mobile interface.
                        Attach photos of fabric and inspirational designs.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                      2
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">Manage Production</h4>
                      <p className="text-muted-foreground text-lg">
                        Assign tasks to your team, set deadlines, and track progress using the
                        digital Kanban board.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                      3
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">Deliver & Get Paid</h4>
                      <p className="text-muted-foreground text-lg">
                        Notify clients automatically when garments are ready. Record payments and
                        generate digital receipts instantly.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 rounded-3xl p-8 border-2 border-primary/10">
                <div className="aspect-video relative rounded-2xl overflow-hidden shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-[var(--color-ghana-gold)]/20 animate-pulse" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <div className="h-20 w-20 bg-primary rounded-full flex items-center justify-center mx-auto shadow-xl shadow-primary/30">
                        <Zap className="h-10 w-10 text-white fill-current" />
                      </div>
                      <p className="text-primary font-bold text-lg font-heading tracking-widest uppercase">
                        Live Demo Preview
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="bg-primary rounded-3xl p-12 md:p-20 text-center relative overflow-hidden shadow-2xl shadow-primary/40">
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              />
              <div className="relative z-10 space-y-8 max-w-2xl mx-auto">
                <h2 className="text-4xl md:text-6xl font-bold font-heading text-white">
                  Join the Future of{' '}
                  <span className="text-[var(--color-ghana-gold)]">Ghanaian Fashion</span>
                </h2>
                <p className="text-xl text-primary-foreground/90">
                  Stop managing your business with paper and move into the digital age today. Free
                  during our beta period.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    className="text-lg px-8 h-14 bg-white text-primary hover:bg-white/90"
                    asChild
                  >
                    <Link href="/auth/register">Create Your Account</Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg px-8 h-14 border-white text-white hover:bg-white/10"
                    asChild
                  >
                    <Link href="#">Contact Support</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t mt-auto bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <div className="bg-primary p-1.5 rounded-lg">
                  <Scissors className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold font-heading tracking-tight">StitchCraft</span>
              </div>
              <p className="text-muted-foreground max-w-xs">
                Built with ❤️ in Accra for the next generation of fashion entrepreneurs in Africa.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4 uppercase text-xs tracking-widest text-primary">
                Platform
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#features" className="hover:text-primary">
                    Features
                  </Link>
                </li>
                <li>
                  <button onClick={() => toast.info('Coming soon!')} className="hover:text-primary text-left">
                    Measurement Engine
                  </button>
                </li>
                <li>
                  <button onClick={() => toast.info('Coming soon!')} className="hover:text-primary text-left">
                    Workshop Queue
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 uppercase text-xs tracking-widest text-primary">
                Company
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <button onClick={() => toast.info('Coming soon!')} className="hover:text-primary text-left">
                    About Us
                  </button>
                </li>
                <li>
                  <button onClick={() => toast.info('Coming soon!')} className="hover:text-primary text-left">
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button onClick={() => toast.info('Coming soon!')} className="hover:text-primary text-left">
                    Service Terms
                  </button>
                </li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-12 border-t">
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} StitchCraft Ghana. High-craft management for high-craft
              fashion.
            </p>
            <div className="flex gap-6">
              <div className="flex items-center gap-1 text-xs font-bold text-muted-foreground uppercase tracking-tighter">
                <div className="w-4 h-3 bg-[var(--color-ghana-red)]" />
                <div className="w-4 h-3 bg-[var(--color-ghana-gold)]" />
                <div className="w-4 h-3 bg-[var(--color-ghana-green)]" />
                <span className="ml-2">Made in Ghana</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
