'use client';

import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  MessageCircle,
  MessageSquarePlus,
  Scissors,
  Smartphone,
  TrendingUp,
  Users,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { FeedbackButton } from '@/components/feedback';
import { FeatureCard } from '@/components/landing/feature-card';
import { KenteBackground } from '@/components/landing/kente-background';
import { Navbar } from '@/components/landing/navbar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useDiscover, useGlobalGallery } from '@/hooks/use-portfolio-cache';
import { ANIMATIONS } from '@/lib/design-system';

export default function LandingPage() {
  const { data: galleryItems, isLoading: galleryLoading } = useGlobalGallery();
  const { data: tailors, isLoading: tailorsLoading } = useDiscover();

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
                    <Link href="/gallery">Explore the Gallery</Link>
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
                    <div className="h-12 w-12 bg-ghana-gold rounded-full flex items-center justify-center">
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

        {/* Featured Gallery Preview */}
        <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
              <div className="max-w-2xl space-y-4">
                <Badge className="bg-primary/20 text-primary border-primary/30 uppercase tracking-widest px-4 py-1">
                  The Public Collection
                </Badge>
                <h2 className="text-4xl md:text-6xl font-bold font-heading">
                  Live from the <br />
                  <span className="text-primary italic text-ghana-gold">Design Gallery</span>
                </h2>
                <p className="text-slate-400 text-lg">
                  Every garment tells a story. Browse the latest masterpieces crafted by artisans
                  using the StitchCraft platform.
                </p>
              </div>
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 h-14 px-8 rounded-2xl group"
                asChild
              >
                <Link href="/gallery">
                  View Full Gallery{' '}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {galleryLoading
                ? Array.from({ length: 4 }, (_, i) => `gallery-skeleton-${i}`).map((key) => (
                  <div key={key} className="aspect-[3/4] rounded-3xl bg-white/5 animate-pulse" />
                ))
                : galleryItems?.slice(0, 4).map((item: any, i: number) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="group cursor-pointer"
                  >
                    <Link href={`/showcase/${item.tailorUsername || '#'}`}>
                      <div className="relative aspect-[3/4] rounded-3xl overflow-hidden mb-4 border border-white/10 shadow-2xl">
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-6">
                          <p className="font-bold text-shadow">{item.title}</p>
                          <p className="text-xs text-white/60">by {item.tailor}</p>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
            </div>
          </div>
          <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 -skew-x-12 transform translate-x-1/2" />
        </section>

        {/* Featured Artisans */}
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <h2 className="text-3xl md:text-5xl font-bold font-heading italic">
                Meet Our Master Tailors
              </h2>
              <p className="text-xl text-muted-foreground">
                Connect directly with certified artisans verified for their excellence,
                professionalism, and craftsmanship.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {tailorsLoading
                ? Array.from({ length: 3 }, (_, i) => `tailor-skeleton-${i}`).map((key) => (
                  <Card key={key} className="h-64 rounded-[2.5rem] bg-white animate-pulse" />
                ))
                : tailors
                  ?.filter((t: any) => t.showcaseEnabled)
                  .slice(0, 3)
                  .map((tailor: any, _i: number) => (
                    <Card
                      key={tailor.id}
                      className="rounded-[2.5rem] p-8 bg-white border-transparent hover:border-primary/20 hover:shadow-2xl transition-all duration-500 group"
                    >
                      <div className="flex flex-col items-center text-center space-y-6">
                        <div className="relative">
                          <Avatar className="h-24 w-24 ring-4 ring-primary/5 group-hover:scale-105 transition-transform">
                            <AvatarImage
                              src={
                                tailor.profileImage ||
                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${tailor.name}`
                              }
                            />
                            <AvatarFallback className="bg-primary/5 text-primary">
                              <Scissors className="h-8 w-8" />
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="min-h-[80px]">
                          <h4 className="text-2xl font-bold font-heading line-clamp-1">
                            {tailor.businessName || tailor.name}
                          </h4>
                          <p className="text-xs uppercase tracking-widest text-primary font-black mt-1">
                            {String(tailor.region || 'ACCRA').replace(/_/g, ' ')}
                          </p>
                        </div>
                        <p className="text-muted-foreground text-sm line-clamp-3 min-h-[60px]">
                          {tailor.bio ||
                            'Professional artisan dedicated to high-quality garment construction and bespoke Ghanaian fashion.'}
                        </p>
                        <div className="flex flex-col gap-3 w-full">
                          {tailor.phone ? (
                            <Button
                              className="h-12 px-6 rounded-2xl bg-[#25D366] hover:bg-[#128C7E] text-white font-bold"
                              asChild
                            >
                              <a
                                href={`https://wa.me/${tailor.phone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <MessageCircle className="h-5 w-5 mr-2" />
                                Message on WhatsApp
                              </a>
                            </Button>
                          ) : (
                            <div className="text-[10px] text-muted-foreground bg-muted/50 py-2 rounded-xl">
                              Contact info unavailable
                            </div>
                          )}
                          <Button
                            variant="outline"
                            className="h-12 px-6 rounded-2xl border-2 font-bold"
                            asChild
                          >
                            <Link href={`/showcase/${tailor.showcaseUsername || tailor.id}`}>
                              <Users className="h-5 w-5 mr-2" />
                              View Portfolio
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
            </div>

            <div className="mt-16 text-center">
              <Button
                variant="ghost"
                className="text-lg font-bold hover:bg-transparent hover:text-primary group"
                asChild
              >
                <Link href="/discover">
                  Browse All Artisans in Ghana{' '}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
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
                  Join the Future of <span className="text-ghana-gold">Ghanaian Fashion</span>
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
                    className="text-lg px-8 h-14 bg-transparent border-white text-white hover:bg-white/10"
                    asChild
                  >
                    <a href="mailto:support@silentech.live">Contact Support</a>
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
                A product of **Silentech Solution Limited**. Built with ❤️ in Ghana for the next
                generation of fashion entrepreneurs in Africa.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4 uppercase text-xs tracking-widest text-primary">
                Platform
              </h4>
              <ul className="space-y-3 text-sm text-slate-500 font-bold">
                <li>
                  <Link href="/gallery" className="hover:text-primary transition-colors">
                    The Gallery
                  </Link>
                </li>
                <li>
                  <Link href="/discover" className="hover:text-primary transition-colors">
                    Find a Tailor
                  </Link>
                </li>
                <li>
                  <Link href="/auth/register" className="hover:text-primary transition-colors">
                    Join as Artisan
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 uppercase text-xs tracking-widest text-primary">
                Legal & Safety
              </h4>
              <ul className="space-y-3 text-sm text-slate-500 font-bold">
                <li>
                  <Link href="/privacy" className="hover:text-primary transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-primary transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/safety" className="hover:text-primary transition-colors">
                    Artisan Safety
                  </Link>
                </li>
                <li>
                  <FeedbackButton
                    variant="minimal"
                    label="Share Feedback"
                    className="hover:text-primary transition-colors"
                  />
                </li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-12 border-t">
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} Silentech Solution Limited. High-craft management for
              high-craft fashion.
            </p>
            <div className="flex gap-6">
              <div className="flex items-center gap-1 text-xs font-bold text-muted-foreground uppercase tracking-tighter">
                <div className="w-4 h-3 bg-ghana-red" />
                <div className="w-4 h-3 bg-ghana-gold" />
                <div className="w-4 h-3 bg-ghana-green" />
                <span className="ml-2">Made in Ghana</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
