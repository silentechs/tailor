'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Heart,
  Loader2,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  Scissors,
  Share2,
  ShoppingBag,
  X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ShareButton } from '@/components/share-button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

async function getShowcaseData(username: string) {
  const res = await fetch(`/api/showcase/public/${username}`);
  if (!res.ok) {
    throw new Error('Failed to fetch showcase data');
  }
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || 'Showcase not found');
  }
  // Transform portfolio items to include likeCount
  return {
    ...json.data,
    portfolioItems: json.data.portfolioItems?.map((item: any) => ({
      ...item,
      likeCount: item._count?.likes || 0,
    })) || [],
  };
}

function trackLead({ tailorId, channel, source }: { tailorId: string; channel: string; source: string }) {
  fetch('/api/analytics/lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tailorId, channel, source }),
  }).catch(() => { });
}

export default function ShowcasePageClient() {
  const params = useParams();
  const username = params.username as string;
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const {
    data: tailor,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['showcase', username],
    queryFn: () => getShowcaseData(username),
  });

  useEffect(() => {
    if (tailor?.id) {
      fetch('/api/analytics/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'profile', id: tailor.id }),
      }).catch((err) => console.error('Failed to record view:', err));
    }
  }, [tailor?.id]);

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
          This designer hasn't set up their public showcase yet.
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

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Features', href: '/#features' },
    { name: 'Gallery', href: '/gallery' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Elegant Header */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Scissors className="h-5 w-5 text-primary group-hover:rotate-12 transition-transform" />
            <span className="font-heading font-black text-xl tracking-tighter">
              StitchCraft <span className="text-muted-foreground font-normal">Showcase</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <nav className="hidden md:flex items-center gap-6 mr-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            <ShareButton
              variant="ghost"
              size="sm"
              className="hidden sm:flex"
              shareTitle={`${tailor.businessName || tailor.name} on StitchCraft`}
              shareText={`Check out ${tailor.businessName || tailor.name}'s showcase!`}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </ShareButton>

            {/* Mobile Menu Trigger */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetTitle>Navigation Menu</SheetTitle>
                <div className="flex flex-col gap-6 py-8">
                  <div className="flex flex-col gap-4">
                    {navLinks.map((link) => (
                      <Link
                        key={link.name}
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-lg font-medium hover:text-primary transition-colors py-2 border-b border-border/50"
                      >
                        {link.name}
                      </Link>
                    ))}
                  </div>
                  <ShareButton
                    variant="outline"
                    className="w-full h-12 rounded-xl mt-4"
                    shareTitle={`${tailor.businessName || tailor.name} on StitchCraft`}
                    shareText={`Check out ${tailor.businessName || tailor.name}'s showcase!`}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share This Profile
                  </ShareButton>
                </div>
              </SheetContent>
            </Sheet>
          </div>
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
            <AvatarImage
              src={
                tailor.profileImage ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${tailor.name}`
              }
            />
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
                'Bespoke West African fashion. Crafting traditional and modern masterpieces with every stitch.'}
            </p>

            <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
              {tailor.phone ? (
                <>
                  <Button
                    className="rounded-full bg-[#25D366] hover:bg-[#1ebd5b] text-white px-8 h-12 font-bold shadow-lg shadow-emerald-100"
                    onClick={() => {
                      trackLead({
                        tailorId: tailor.id,
                        channel: 'whatsapp',
                        source: 'showcase',
                      });
                    }}
                    asChild
                  >
                    <a
                      href={`https://wa.me/${tailor.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="h-5 w-5 mr-2" />
                      Message on WhatsApp
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-full px-8 h-12 font-bold border-slate-200"
                    onClick={() => {
                      trackLead({
                        tailorId: tailor.id,
                        channel: 'phone',
                        source: 'showcase',
                      });
                    }}
                    asChild
                  >
                    <a href={`tel:${tailor.phone}`}>
                      <Phone className="h-4 w-4 mr-2" />
                      Call Business
                    </a>
                  </Button>
                </>
              ) : (
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm text-slate-500 font-medium">
                  Contact information is currently private.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Background Pattern - SVG Kente */}
        <div className="absolute top-0 right-0 w-1/3 h-full opacity-[0.05] pointer-events-none transform translate-x-32 rotate-12">
          <svg
            width="400"
            height="800"
            viewBox="0 0 400 800"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <title>Kente pattern background</title>
            <rect width="400" height="800" fill="url(#kente_pattern)" />
            <defs>
              <pattern
                id="kente_pattern"
                x="0"
                y="0"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <rect width="10" height="40" fill="#CE1126" />
                <rect x="10" width="10" height="40" fill="#FCD116" />
                <rect x="20" width="10" height="40" fill="#006B3F" />
                <rect x="30" width="10" height="40" fill="#000000" />
              </pattern>
            </defs>
          </svg>
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
              <PortfolioCard key={item.id} item={item} params={params} />
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
            Empowering West African Fashion Designers through Technology.
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
            © {new Date().getFullYear()} Silentech Solution Enterprise. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function PortfolioCard({ item, params }: { item: any; params: any }) {
  return (
    <Card className="group border-none shadow-none bg-transparent overflow-hidden h-full flex flex-col">
      <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-lg transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-2">
        <Image
          src={item.images[0] || '/placeholder-garment.jpg'}
          alt={item.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <Link href={`/showcase/${params.username}/${item.id}`}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6">
            <div className="flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                <span className="font-bold text-sm">{item.likeCount || 0}</span>
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
        </Link>
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
