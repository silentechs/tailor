'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Heart, Loader2, MapPin, Share2 } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function StudioStyleHubPage() {
  const { data: wishlistData, isLoading } = useQuery({
    queryKey: ['studio', 'wishlist'],
    queryFn: async () => {
      const res = await fetch('/api/studio/wishlist');
      if (!res.ok) throw new Error('Failed to fetch wishlist');
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-ghana-gold" />
      </div>
    );
  }

  const wishlist = wishlistData?.data || [];

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
        <div>
          <span className="text-ghana-gold font-black uppercase tracking-[0.3em] text-[10px] mb-4 block">
            Visual Library
          </span>
          <h1 className="text-5xl md:text-8xl font-black font-heading tracking-tighter uppercase italic leading-none">
            Style <br /> Hub.
          </h1>
        </div>
        <div className="max-w-xs text-right">
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs leading-loose">
            Your personal collection of inspirations and saved work from StitchCraft tailors.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {wishlist.map((item: any, idx: number) => (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={item.id}
            className="group relative bg-zinc-900 border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-ghana-gold/30 transition-all duration-500 shadow-2xl shadow-black/20"
          >
            {/* Image Container */}
            <div className="aspect-[4/5] overflow-hidden relative">
              <img
                src={
                  item.portfolioItem.images[0] ||
                  'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=800'
                }
                alt={item.portfolioItem.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ghana-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="absolute top-6 right-6">
                <Button
                  size="icon"
                  className="h-12 w-12 rounded-2xl bg-ghana-gold text-ghana-black border-none shadow-xl hover:bg-red-500 hover:text-white transition-colors"
                  onClick={async () => {
                    await fetch('/api/studio/wishlist', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ portfolioItemId: item.portfolioItem.id }),
                    });
                    // Simple reload or invalidate
                    window.location.reload();
                  }}
                >
                  <Heart className="h-5 w-5 fill-current" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-black font-heading uppercase group-hover:text-ghana-gold transition-colors">
                    {item.portfolioItem.title}
                  </h3>
                  <div className="flex items-center gap-2 text-zinc-500 mt-2">
                    <MapPin className="h-3 w-3" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      {item.portfolioItem.organization.name}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-8">
                {item.portfolioItem.tags?.slice(0, 3).map((tag: string) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-[9px] uppercase font-black tracking-tighter border-white/10 rounded-full px-3 py-0.5"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center gap-4">
                <Button
                  asChild
                  className="flex-1 bg-white/5 hover:bg-white/10 border-white/5 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all"
                >
                  <Link href={`/showcase/${item.portfolioItem.tailor?.showcaseUsername || '#'}`}>
                    View Tailor
                  </Link>
                </Button>
                <Button
                  size="icon"
                  className="h-14 w-14 rounded-2xl bg-white/5 hover:bg-white/10 border-white/5 text-zinc-400"
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}

        {wishlist.length === 0 && (
          <div className="col-span-full py-40 border-2 border-dashed border-white/5 rounded-[3rem] flex flex-col items-center justify-center text-center">
            <div className="h-20 w-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
              <Heart className="h-10 w-10 text-zinc-800" />
            </div>
            <h3 className="text-xl font-black font-heading uppercase mb-2">
              Your library is empty
            </h3>
            <p className="text-zinc-600 font-bold uppercase tracking-widest text-xs">
              Explore the gallery to save inspirations.
            </p>
            <Button
              className="mt-8 rounded-full px-8 bg-ghana-gold text-ghana-black hover:bg-ghana-gold/90 font-black"
              asChild
            >
              <Link href="/gallery">Explore Gallery</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
