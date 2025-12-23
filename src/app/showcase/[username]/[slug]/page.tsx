'use client';

import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  Heart,
  Info,
  Loader2,
  Maximize2,
  MessageCircle,
  Tag,
  X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ShareButton } from '@/components/share-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { trackLead } from '@/lib/tracking';

export default function PortfolioItemPage() {
  const router = useRouter();
  const { username, slug: itemId } = useParams();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const {
    data: project,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['portfolio-item', itemId],
    queryFn: async () => {
      const res = await fetch(`/api/portfolio/public/${itemId}`);
      if (!res.ok) throw new Error('Project not found');
      const data = await res.json();
      return data.data;
    },
  });

  useEffect(() => {
    if (project?.id) {
      fetch('/api/analytics/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'portfolio_item', id: project.id }),
      }).catch((err) => console.error('Failed to record view:', err));
    }
  }, [project?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-sm font-medium text-muted-foreground">Unrolling the fabric...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold font-heading">Project Unavailable</h2>
        <p className="text-muted-foreground mt-2 max-w-xs">
          This masterpiece is currently being kept private.
        </p>
        <Button
          variant="link"
          onClick={() => router.back()}
          className="mt-4 text-primary font-bold"
        >
          Return to Showcase
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Immersive Header */}
      <header className="fixed top-0 left-0 w-full h-20 bg-white/10 backdrop-blur-md z-50 px-8 flex items-center justify-between border-b border-white/10">
        <Button
          variant="ghost"
          className="rounded-full bg-white/20 text-white hover:bg-white/30"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </Button>
        <div className="flex gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-white/20 text-white hover:bg-white/30"
            onClick={async () => {
              try {
                const res = await fetch('/api/studio/wishlist', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ portfolioItemId: project.id }),
                });
                const data = await res.json();
                if (data.action === 'added') {
                  toast.success('Saved to Style Hub!');
                } else if (data.action === 'removed') {
                  toast.info('Removed from Style Hub');
                } else if (!data.success) {
                  toast.error('Sign in to save inspirations');
                }
              } catch {
                toast.error('Sign in to save inspirations');
              }
            }}
          >
            <Heart className="h-5 w-5" />
          </Button>
          <ShareButton
            className="bg-white/20 text-white hover:bg-white/30"
            shareTitle={project.title}
            shareText={`Check out this amazing ${project.category.replace(/_/g, ' ')} by ${project.tailor.businessName || project.tailor.name}`}
          />
        </div>
      </header>

      <main className="pt-0">
        {/* Full Width Hero Image */}
        <section className="relative h-[85vh] w-full overflow-hidden">
          <Image
            src={project.images[0]}
            alt={project.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-16 left-8 md:left-20 max-w-4xl space-y-6"
          >
            <Badge className="bg-primary text-white border-none px-4 py-1.5 uppercase font-black tracking-widest text-xs">
              {project.category.replace(/_/g, ' ')}
            </Badge>
            <h1 className="text-6xl md:text-8xl font-black font-heading text-white tracking-tight leading-none italic">
              {project.title}
            </h1>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-white/20">
                  <Image
                    src={
                      project.tailor.profileImage ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${project.tailor.name}`
                    }
                    alt={project.tailor.name}
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                </div>
                <span className="text-white font-bold text-lg">
                  {project.tailor.businessName || project.tailor.name}
                </span>
              </div>
              <div className="h-6 w-[1px] bg-white/20" />
              <div className="flex items-center gap-2 text-white/60 font-medium">
                <Calendar className="h-4 w-4" />
                {new Date(project.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
            </div>
          </motion.div>
        </section>

        {/* Content Section */}
        <section className="max-w-7xl mx-auto px-8 py-24 grid lg:grid-cols-3 gap-20">
          <div className="lg:col-span-2 space-y-16">
            <div className="space-y-8">
              <h2 className="text-3xl font-bold font-heading text-slate-900 italic flex items-center gap-4">
                <Info className="h-8 w-8 text-primary" />
                The Story
              </h2>
              <p className="text-2xl text-slate-600 leading-relaxed font-medium">
                {project.description}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {project.images.map((img: string, i: number) => (
                <motion.div
                  key={img}
                  layoutId={`image-${img}`}
                  className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl group cursor-zoom-in"
                  onClick={() => setSelectedImage(img)}
                >
                  <Image
                    src={img}
                    alt={`${project.title} detail ${i + 1}`}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Maximize2 className="h-10 w-10 text-white" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="space-y-12">
            <Card className="rounded-[2.5rem] p-10 bg-white border-none shadow-xl space-y-8 sticky top-32">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                  Attributes
                </h4>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="secondary"
                    className="bg-slate-100 text-slate-600 border-none font-bold text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full"
                  >
                    <Tag className="h-3 w-3 mr-2 opacity-50" />
                    {project.category.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </div>

              <div className="h-[1px] bg-slate-50" />

              <div className="space-y-6">
                <p className="text-slate-500 font-medium text-sm leading-relaxed">
                  Inspired by this piece? Contact{' '}
                  {project.tailor.businessName || project.tailor.name} to discuss your custom
                  vision.
                </p>
                <Button
                  className="w-full h-14 rounded-2xl font-bold shadow-xl shadow-primary/20 text-lg uppercase tracking-widest"
                  onClick={() => {
                    trackLead({
                      tailorId: project.tailorId,
                      portfolioItemId: project.id,
                      channel: 'inquiry_form',
                      source: 'showcase',
                    });
                  }}
                  asChild
                >
                  <Link href={`/showcase/${username}`}>
                    <MessageCircle className="h-5 w-5 mr-3" />
                    Initiate Inquiry
                  </Link>
                </Button>
              </div>
            </Card>
          </div>
        </section>
      </main>

      <footer className="py-20 bg-slate-100 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-8 text-center space-y-4">
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
            Made with Heart In Ghana
          </p>
          <p className="text-slate-500 font-medium">
            © {new Date().getFullYear()} StitchCraft Global Artisan Suite.
          </p>
        </div>
      </footer>

      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
          >
            <motion.div
              layoutId={`image-${selectedImage}`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-5xl h-full max-h-[90vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={selectedImage}
                alt="Full screen view"
                fill
                className="object-contain"
                priority
              />
              <Button
                size="icon"
                variant="ghost"
                className="absolute -top-12 right-0 md:top-4 md:right-4 text-white/50 hover:text-white hover:bg-white/10 rounded-full"
                onClick={() => setSelectedImage(null)}
              >
                <X className="h-8 w-8" />
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
