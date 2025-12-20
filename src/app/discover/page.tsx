'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, Star, UserPlus, Sparkles, SlidersHorizontal, Scissors } from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { KenteBackground } from '@/components/landing/kente-background';
import { Navbar } from '@/components/landing/navbar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { GHANA_REGIONS } from '@/lib/utils';
import { useDiscover } from '@/hooks/use-portfolio-cache';
import { Skeleton } from '@/components/ui/skeleton';

interface Tailor {
    id: string;
    name: string;
    businessName: string;
    showcaseUsername: string;
    region: string;
    specialty: string;
    profileImage: string | null;
    rating?: string;
}

export default function DiscoverPage() {
    const [search, setSearch] = useState('');
    const [selectedRegion, setSelectedRegion] = useState('ALL');
    const { data: tailors = [] as Tailor[], isLoading } = useDiscover();

    const regions = useMemo<string[]>(() => {
        const uniqueRegions = Array.from<string>(new Set(tailors.map((t: Tailor) => t.region)));
        return ['ALL', ...uniqueRegions];
    }, [tailors]);

    const filteredTailors = useMemo(() => {
        return tailors.filter((t: Tailor) => {
            const matchesRegion = selectedRegion === 'ALL' || t.region === selectedRegion;
            const matchesSearch = t.businessName.toLowerCase().includes(search.toLowerCase()) ||
                t.specialty.toLowerCase().includes(search.toLowerCase()) ||
                t.name.toLowerCase().includes(search.toLowerCase());

            return matchesRegion && matchesSearch;
        });
    }, [tailors, selectedRegion, search]);

    const resetFilters = () => {
        setSearch('');
        setSelectedRegion('ALL');
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
                            <span>Verified Artisans of Ghana</span>
                        </motion.div>

                        <h1 className="text-5xl md:text-8xl font-bold font-heading tracking-tight leading-[1.1]">
                            Find Your <span className="text-primary italic">Artisan</span>
                        </h1>

                        <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto font-medium">
                            Connect with master tailors who bring heritage to life. Bespoke craftsmanship, verified professionalism.
                        </p>
                    </div>

                    {/* Advanced Filter Bar */}
                    <div className="sticky top-24 z-30 mb-16">
                        <div className="max-w-4xl mx-auto bg-background/80 backdrop-blur-2xl p-4 rounded-3xl border border-border/50 shadow-2xl flex flex-col md:flex-row gap-4 items-center">
                            <div className="relative flex-grow group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder="Search by name, business or specialty..."
                                    className="pl-12 bg-muted/30 border-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all rounded-2xl h-12"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>

                            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                                <SelectTrigger className="h-12 w-full md:w-56 rounded-2xl bg-muted/30 border-none">
                                    <MapPin className="h-4 w-4 mr-2 text-ghana-gold" />
                                    <SelectValue placeholder="Filter by Region" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl">
                                    {regions.map((region: string) => (
                                        <SelectItem key={region} value={region}>
                                            {region === 'ALL' ? 'All Regions (Ghana)' : GHANA_REGIONS[region] || region}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {(selectedRegion !== 'ALL' || search) && (
                                <Button
                                    variant="ghost"
                                    onClick={resetFilters}
                                    className="text-muted-foreground hover:text-primary transition-colors h-12"
                                >
                                    Reset
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <AnimatePresence mode="popLayout">
                            {isLoading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <Card key={i} className="rounded-[3rem] p-10 space-y-8 bg-white/50 border-none shadow-xl">
                                        <Skeleton className="h-32 w-32 rounded-full mx-auto" />
                                        <div className="space-y-4">
                                            <Skeleton className="h-8 w-3/4 mx-auto" />
                                            <Skeleton className="h-4 w-1/2 mx-auto" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Skeleton className="h-12 rounded-2xl" />
                                            <Skeleton className="h-12 rounded-2xl" />
                                        </div>
                                    </Card>
                                ))
                            ) : (
                                filteredTailors.map((tailor: Tailor, idx: number) => (
                                    <motion.div
                                        key={tailor.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ delay: idx * 0.1 }}
                                    >
                                        <Card className="group relative overflow-hidden border-none bg-white/80 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-700 rounded-[3rem] p-10">
                                            <CardContent className="p-0 flex flex-col items-center text-center space-y-8">
                                                <div className="relative">
                                                    <Avatar className="h-32 w-32 ring-8 ring-primary/5 shadow-2xl transition-all duration-700 group-hover:scale-105 group-hover:rotate-1">
                                                        <AvatarImage src={tailor.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${tailor.name}`} />
                                                        <AvatarFallback className="bg-primary text-white text-3xl font-black">{tailor.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="absolute -bottom-2 -right-2 bg-white px-3 py-1.5 rounded-full shadow-lg border border-border/50 flex items-center gap-1.5 text-xs font-black">
                                                        <Star className="h-4 w-4 fill-ghana-gold text-ghana-gold" />
                                                        {tailor.rating || '4.9'}
                                                    </div>
                                                </div>

                                                <div className="space-y-3 w-full">
                                                    <h3 className="text-3xl font-bold font-heading text-slate-900 leading-[1.2] tracking-tight">{tailor.businessName}</h3>
                                                    <div className="flex items-center justify-center gap-2 text-muted-foreground font-bold text-sm uppercase tracking-widest">
                                                        <MapPin className="h-4 w-4 text-red-500" />
                                                        {GHANA_REGIONS[tailor.region] || tailor.region}
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap justify-center gap-2">
                                                    <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-black text-[10px] px-4 py-1.5 uppercase tracking-widest rounded-full">
                                                        {tailor.specialty || 'Master Tailor'}
                                                    </Badge>
                                                </div>

                                                <div className="grid grid-cols-1 gap-3 w-full pt-4">
                                                    <Button className="rounded-2xl h-14 font-black shadow-lg shadow-primary/20 bg-primary group-hover:bg-primary/90 transition-all text-white" asChild>
                                                        <Link href={`/showcase/${tailor.showcaseUsername}`}>
                                                            Visit Showcase Studio
                                                        </Link>
                                                    </Button>
                                                    <Button variant="outline" className="rounded-2xl h-14 font-black border-2 border-slate-100 hover:bg-slate-50 transition-all" asChild>
                                                        <Link href={`/showcase/${tailor.showcaseUsername}`}>
                                                            Check Availability
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </CardContent>

                                            {/* Decorative Background Element */}
                                            <div className="absolute top-0 right-0 w-48 h-48 opacity-[0.02] pointer-events-none transform translate-x-1/2 -translate-y-1/2 transition-transform duration-1000 group-hover:rotate-12 group-hover:scale-110">
                                                <Scissors className="w-full h-full text-primary" />
                                            </div>
                                        </Card>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>

                    {filteredTailors.length === 0 && !isLoading && (
                        <div className="text-center py-48 space-y-8">
                            <div className="h-24 w-24 bg-muted/50 rounded-full flex items-center justify-center mx-auto opacity-30">
                                <Search className="h-12 w-12" />
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-3xl font-bold font-heading">No Artisans Found</h3>
                                <p className="text-muted-foreground font-medium max-w-sm mx-auto text-lg leading-relaxed">
                                    We couldn't find any certified artisans matching your current selection. Maybe try another region?
                                </p>
                            </div>
                            <Button
                                size="lg"
                                className="rounded-2xl px-12 h-14 font-bold bg-primary text-white"
                                onClick={resetFilters}
                            >
                                Reset All Discovery Filters
                            </Button>
                        </div>
                    )}
                </div>
            </main>

            <footer className="py-20 border-t bg-muted/20">
                <div className="container mx-auto px-4 text-center space-y-4">
                    <div className="flex justify-center gap-1 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
                        <div className="w-8 h-6 bg-[var(--color-ghana-red)]" />
                        <div className="w-8 h-6 bg-[var(--color-ghana-gold)]" />
                        <div className="w-8 h-6 bg-[var(--color-ghana-green)]" />
                    </div>
                    <p className="text-muted-foreground text-sm font-medium">
                        Elevating Ghana's Fashion Ecosystem. © {new Date().getFullYear()} StitchCraft.
                    </p>
                </div>
            </footer>
        </div>
    );
}
