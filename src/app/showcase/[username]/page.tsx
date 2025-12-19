'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Heart,
  Loader2,
  MapPin,
  MessageCircle,
  Phone,
  Scissors,
  Share2,
  ShoppingBag,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

async function getShowcaseData(username: string) {
  const res = await fetch(`/api/showcase/public/${username}`);
  if (!res.ok) {
    throw new Error('Showcase not found');
  }
  const data = await res.json();
  return data.data;
}

export default function ShowcasePage() {
  const { username } = useParams();
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const {
    data: tailor,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['showcase', username],
    queryFn: () => getShowcaseData(username as string),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-sm font-medium text-muted-foreground">Opening the trunk...</p>
      </div>
    );
  }

  if (error || !tailor) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold font-heading">Showcase Unavailable</h2>
        <p className="text-muted-foreground mt-2 max-w-xs">
          This tailor hasn't set up their public showcase yet.
        </p>
        <Button variant="link" asChild className="mt-4">
          <Link href="/">Back to StitchCraft</Link>
        </Button>
      </div>
    );
  }

  const filteredItems = filterCategory
    ? tailor.portfolioItems.filter((i: any) => i.category === filterCategory)
    : tailor.portfolioItems;

  const categories = Array.from(
    new Set(tailor.portfolioItems.map((i: any) => i.category))
  ) as string[];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Elegant Header */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scissors className="h-5 w-5 text-primary" />
            <span className="font-heading font-black text-xl tracking-tighter">
              StitchCraft <span className="text-muted-foreground font-normal">Showcase</span>
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success('Link copied to clipboard');
            }}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Profile Hero section with Ghana colors hint */}
      <div className="bg-white relative border-b overflow-hidden">
        {/* Subtle Ghana flag colors top strip */}
        <div className="h-1 w-full flex">
          <div className="h-full flex-1 bg-[#EE272E]" />
          <div className="h-full flex-1 bg-[#FCD116]" />
          <div className="h-full flex-1 bg-[#00AA4F]" />
        </div>

        <div className="max-w-4xl mx-auto px-6 py-12 md:py-20 relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
          <Avatar className="h-32 w-32 md:h-40 md:w-40 ring-4 ring-slate-50 shadow-2xl">
            <AvatarImage src={tailor.profileImage} />
            <AvatarFallback className="bg-primary text-white text-4xl font-black">
              {tailor.name.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 text-center md:text-left space-y-4">
            <div className="space-y-1">
              <h1 className="text-4xl md:text-5xl font-black font-heading text-slate-900 tracking-tight">
                {tailor.businessName || tailor.name}
              </h1>
              <div className="flex items-center justify-center md:justify-start gap-4 text-muted-foreground font-medium">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-red-500" />
                  {tailor.city}, {tailor.region?.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            <p className="text-lg text-slate-600 max-w-2xl leading-relaxed">
              {tailor.bio ||
                'Bespoke Ghanaian tailoring. Crafting traditional and modern masterpieces with every stitch.'}
            </p>

            <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
              <Button
                className="rounded-full bg-[#25D366] hover:bg-[#1ebd5b] text-white px-8 h-12 font-bold shadow-lg shadow-emerald-100"
                asChild
              >
                <a href={`https://wa.me/${tailor.phone?.replace(/[^0-9]/g, '')}`}>
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Message on WhatsApp
                </a>
              </Button>
              <Button
                variant="outline"
                className="rounded-full px-8 h-12 font-bold border-slate-200"
                asChild
              >
                <a href={`tel:${tailor.phone}`}>
                  <Phone className="h-4 w-4 mr-2" />
                  Call Business
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Background Pattern */}
        <div className="absolute top-0 right-0 w-1/3 h-full opacity-[0.03] pointer-events-none transform translate-x-32 rotate-12">
          <Image src="/pattern-kente.png" alt="" fill className="object-cover" />
        </div>
      </div>

      {/* Portfolio Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <h2 className="text-3xl font-black font-heading flex items-center gap-3">
            <ShoppingBag className="h-8 w-8 text-primary" />
            Our Collection
          </h2>

          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            <Button
              variant={filterCategory === null ? 'default' : 'outline'}
              size="sm"
              className="rounded-full"
              onClick={() => setFilterCategory(null)}
            >
              All Work
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={filterCategory === cat ? 'default' : 'outline'}
                size="sm"
                className="rounded-full whitespace-nowrap"
                onClick={() => setFilterCategory(cat)}
              >
                {cat.replace(/_/g, ' ')}
              </Button>
            ))}
          </div>
        </div>

        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredItems.map((item: any) => (
              <PortfolioCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Scissors className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold font-heading">No items found</h3>
            <p className="text-muted-foreground max-w-xs mx-auto mt-2">
              Check back soon as we update our collection periodically.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t py-12">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Scissors className="h-6 w-6 text-primary" />
            <span className="font-heading font-black text-2xl tracking-tighter text-primary">
              StitchCraft
            </span>
          </div>
          <p className="text-muted-foreground text-sm">
            Empowering Ghanaian Tailors through Technology.
          </p>
          <div className="flex justify-center gap-6 pt-4">
            <Link
              href="/privacy"
              className="text-xs text-muted-foreground hover:text-primary underline"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-xs text-muted-foreground hover:text-primary underline"
            >
              Terms of Service
            </Link>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pt-8">
            © {new Date().getFullYear()} StitchCraft Global. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function PortfolioCard({ item }: { item: any }) {
  return (
    <Card className="group border-none shadow-none bg-transparent overflow-hidden h-full flex flex-col">
      <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-lg transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-2">
        <Image
          src={item.images[0] || '/placeholder-garment.jpg'}
          alt={item.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6">
          <div className="flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 fill-red-500 text-red-500" />
              <span className="font-bold text-sm">{item._count.likes}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white backdrop-blur-md rounded-full px-4 h-9 font-bold text-xs"
            >
              View Details
            </Button>
          </div>
        </div>
        <Badge className="absolute top-4 left-4 bg-white/90 text-primary border-none shadow-sm backdrop-blur uppercase text-[10px] font-black px-3 py-1">
          {item.category.replace(/_/g, ' ')}
        </Badge>
      </div>

      <div className="pt-4 px-2 space-y-1">
        <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors truncate">
          {item.title}
        </h3>
        {item.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        )}
        <div className="flex flex-wrap gap-1 pt-2">
          {item.tags?.map((tag: string) => (
            <span
              key={tag}
              className="text-[10px] text-muted-foreground font-medium bg-slate-100 px-2 py-0.5 rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}
