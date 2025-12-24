'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Heart, MapPin, Scissors, Search, Sparkles, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { KenteBackground } from '@/components/landing/kente-background';
import { Navbar } from '@/components/landing/navbar';
import { SaveButton } from '@/components/save-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useGlobalGallery } from '@/hooks/use-portfolio-cache';
import { GARMENT_TYPE_LABELS, GHANA_REGIONS } from '@/lib/utils';

interface GalleryItem {
  id: string;
  title: string;
  category: string;
  image: string;
  tailor: string;
  tailorUsername: string;
  region: string;
}

export default function GalleryPage() {
  const [filter, setFilter] = useState('ALL');
  const [selectedArtisan, setSelectedArtisan] = useState('ALL');
  const [selectedRegion, setSelectedRegion] = useState('ALL');
  const [search, setSearch] = useState('');

  const { data: galleryItems = [] as GalleryItem[], isLoading } = useGlobalGallery();

  const garmentTypes = useMemo(() => ['ALL', ...Object.keys(GARMENT_TYPE_LABELS)], []);

  const artisans = useMemo<string[]>(() => {
    const uniqueArtisans = Array.from<string>(
      new Set(galleryItems.map((item: GalleryItem) => item.tailor))
    );
    return ['ALL', ...uniqueArtisans];
  }, [galleryItems]);

  const regions = useMemo<string[]>(() => {
    const uniqueRegions = Array.from<string>(
      new Set(galleryItems.map((item: GalleryItem) => item.region))
    );
    return ['ALL', ...uniqueRegions];
  }, [galleryItems]);

  const filteredItems = useMemo(() => {
    return galleryItems.filter((item: GalleryItem) => {
      const matchesCategory = filter === 'ALL' || item.category === filter;
      const matchesArtisan = selectedArtisan === 'ALL' || item.tailor === selectedArtisan;
      const matchesRegion = selectedRegion === 'ALL' || item.region === selectedRegion;
      const matchesSearch =
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.tailor.toLowerCase().includes(search.toLowerCase());

      return matchesCategory && matchesArtisan && matchesRegion && matchesSearch;
    });
  }, [galleryItems, filter, selectedArtisan, selectedRegion, search]);

  const resetFilters = () => {
    setFilter('ALL');
    setSelectedArtisan('ALL');
    setSelectedRegion('ALL');
    setSearch('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
      <Navbar />

      <main className="flex-grow pt-24 pb-20">
        <KenteBackground />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-12 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20"
            >
              <Sparkles className="h-4 w-4" />
              <span>Premium Curation of Ghanaian Excellence</span>
            </motion.div>

            <h1 className="text-5xl md:text-8xl font-bold font-heading tracking-tight leading-[1.1]">
              Design <span className="text-primary italic">Gallery</span>
            </h1>

            <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto font-medium">
              Discover the future of high-fashion tailoring. From hand-woven Kente to precision-cut
              architecture.
            </p>

            {/* Signup prompt for non-logged users */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-ghana-gold/10 border border-ghana-gold/20"
            >
              <Heart className="h-4 w-4 text-ghana-gold" />
              <span className="text-sm font-medium text-foreground">
                Save your favorite designs
              </span>
              <Link
                href="/auth/register?role=client"
                className="text-sm font-bold text-primary hover:underline"
              >
                Create Account →
              </Link>
            </motion.div>
          </div>

          {/* Filter Bar */}
          <div className="sticky top-24 z-30 mb-12 space-y-4">
            <div className="bg-background/80 backdrop-blur-2xl p-4 rounded-3xl border border-border/50 shadow-2xl flex flex-col md:flex-row gap-4 items-center">
              <div className="relative w-full md:w-1/3 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Search styles or artisans..."
                  className="pl-12 bg-muted/30 border-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all rounded-2xl h-12"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap md:flex-nowrap gap-3 items-center w-full md:w-auto">
                <Select value={selectedArtisan} onValueChange={setSelectedArtisan}>
                  <SelectTrigger className="h-12 w-full md:w-48 rounded-2xl bg-muted/30 border-none">
                    <User className="h-4 w-4 mr-2 text-primary" />
                    <SelectValue placeholder="All Artisans" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {artisans.map((artisan: string) => (
                      <SelectItem key={artisan} value={artisan}>
                        {artisan === 'ALL' ? 'All Artisans' : artisan}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger className="h-12 w-full md:w-48 rounded-2xl bg-muted/30 border-none">
                    <MapPin className="h-4 w-4 mr-2 text-ghana-gold" />
                    <SelectValue placeholder="All Regions" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {regions.map((region: string) => (
                      <SelectItem key={region} value={region}>
                        {region === 'ALL' ? 'All Regions' : GHANA_REGIONS[region] || region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {(filter !== 'ALL' ||
                  selectedArtisan !== 'ALL' ||
                  selectedRegion !== 'ALL' ||
                  search) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetFilters}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      Reset Filters
                    </Button>
                  )}
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar px-2">
              {garmentTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFilter(type)}
                  className={`
                                        px-6 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300
                                        ${filter === type
                      ? 'bg-primary text-white shadow-lg shadow-primary/20'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent hover:border-primary/20'
                    }
                                    `}
                >
                  {type === 'ALL' ? 'Everything' : GARMENT_TYPE_LABELS[type] || type}
                </button>
              ))}
            </div>
          </div>

          {/* Gallery Grid */}
          <motion.div
            layout
            className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6"
          >
            <AnimatePresence mode="popLayout">
              {isLoading
                ? Array.from({ length: 8 }, (_, i) => `skeleton-${i}`).map((key) => (
                  <div key={key} className="break-inside-avoid">
                    <Skeleton className="aspect-[3/4] w-full rounded-[2.5rem]" />
                  </div>
                ))
                : filteredItems.map((item: GalleryItem) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4 }}
                    className="break-inside-avoid group relative"
                  >
                    {/* Save to Style Hub button */}
                    <SaveButton
                      portfolioItemId={item.id}
                      className="absolute top-4 right-4 z-20 h-10 w-10 rounded-full bg-black/50 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-primary hover:scale-110"
                      iconClassName="h-5 w-5"
                    />
                    <Link href={`/showcase/${item.tailorUsername}`}>
                      <Card className="group relative overflow-hidden border-none bg-accent/5 shadow-none cursor-pointer rounded-[2.5rem]">
                        <div className="relative aspect-[3/4] overflow-hidden transition-all duration-700 group-hover:shadow-2xl">
                          <Image
                            src={item.image}
                            alt={item.title}
                            fill
                            className="object-cover transition-transform duration-1000 group-hover:scale-110"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                            placeholder="blur"
                            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkqG9YDwADEQExX9/5nQAAAABJRU5ErkJggg=="
                            priority={filteredItems.indexOf(item) < 4}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-8">
                            <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 space-y-4">
                              <div className="flex flex-wrap gap-2">
                                <Badge className="bg-primary/90 text-white border-none shadow-sm backdrop-blur uppercase text-[10px] font-black tracking-widest px-3 py-1">
                                  {GARMENT_TYPE_LABELS[item.category] || item.category}
                                </Badge>
                                <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold text-white uppercase">
                                  <MapPin className="h-3 w-3" />
                                  {GHANA_REGIONS[item.region] || item.region}
                                </div>
                              </div>
                              <div>
                                <h3 className="text-2xl font-bold text-white font-heading leading-tight tracking-tight">
                                  {item.title}
                                </h3>
                                <p className="text-ghana-gold text-sm font-black flex items-center gap-2 mt-1">
                                  <User className="h-3 w-3" />
                                  {item.tailor}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                      {/* Permanent labels below the card for better UX */}
                      <div className="mt-4 px-4">
                        <h3 className="text-lg font-bold font-heading truncate">{item.title}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5 font-medium">
                          <Scissors className="h-3.5 w-3.5 text-primary" />
                          {item.tailor}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
            </AnimatePresence>
          </motion.div>

          {filteredItems.length === 0 && !isLoading && (
            <div className="text-center py-48 space-y-8 max-w-md mx-auto">
              <div className="h-24 w-24 bg-muted/50 rounded-full flex items-center justify-center mx-auto ring-8 ring-muted/20">
                <Scissors className="h-12 w-12 text-muted-foreground/30 animate-pulse" />
              </div>
              <div className="space-y-4">
                <h3 className="text-3xl font-bold font-heading">No Masterpieces Found</h3>
                <p className="text-muted-foreground font-medium">
                  We couldn't find any designs matching your specific selection. Try broadening your
                  filters.
                </p>
              </div>
              <Button
                size="lg"
                className="rounded-2xl px-12 h-14 font-bold bg-primary text-white"
                onClick={resetFilters}
              >
                Clear All Search Criteria
              </Button>
            </div>
          )}
        </div>
      </main>

      <footer className="py-20 border-t mt-auto bg-muted/20">
        <div className="container mx-auto px-4 text-center space-y-4">
          <div className="flex justify-center gap-1 transition-all duration-500 hover:scale-105">
            <div className="w-8 h-6 bg-ghana-red" />
            <div className="w-8 h-6 bg-ghana-gold" />
            <div className="w-8 h-6 bg-ghana-green" />
          </div>
          <p className="text-muted-foreground text-sm font-medium">
            © {new Date().getFullYear()} StitchCraft Global Gallery. Curated in Accra, Ghana.
          </p>
        </div>
      </footer>
    </div>
  );
}
