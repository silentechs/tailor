'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    ArrowUpRight,
    Calendar,
    Clock,
    ExternalLink,
    Layers,
    Ruler,
    ShoppingBag,
    Star,
    TriangleAlert
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React from 'react';

export default function StudioDashboard() {
    const { data: overview, isLoading } = useQuery({
        queryKey: ['studio', 'overview'],
        queryFn: async () => {
            const res = await fetch('/api/studio/overview');
            if (!res.ok) throw new Error('Failed to fetch overview');
            return res.json();
        }
    });

    const skeleton = (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-64 bg-white/5 animate-pulse rounded-[2.5rem]" />
            ))}
        </div>
    );

    if (isLoading) return <div className="p-8">{skeleton}</div>;

    const data = overview?.data;

    if (!data?.isLinked) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-8 text-center max-w-2xl mx-auto">
                <div className="h-24 w-24 bg-ghana-gold/10 rounded-full flex items-center justify-center mb-8">
                    <TriangleAlert className="h-12 w-12 text-ghana-gold" />
                </div>
                <h1 className="text-4xl font-black font-heading tracking-tight mb-6 uppercase">Account Unlinked</h1>
                <p className="text-zinc-400 text-lg mb-10 leading-relaxed font-bold">
                    Your account is not yet connected to a tailor's client record.
                    Use the link provided by your tailor to sync your orders and measurements.
                </p>
                <LinkAccountDialog />
            </div>
        );
    }

    return (
        <div className="space-y-12 pb-20">
            {/* Header Section: Asymmetric Titles */}
            <section className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <span className="text-ghana-gold font-black uppercase tracking-[0.3em] text-sm mb-4 block">
                        Welcome to the Studio
                    </span>
                    <h1 className="text-6xl md:text-8xl font-black font-heading tracking-tighter leading-none uppercase">
                        Curated <br /> Fashion.
                    </h1>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="max-w-xs text-zinc-500 font-bold uppercase tracking-widest text-xs leading-loose"
                >
                    Your personal portal for bespoke tracking, measurements, and a dedicated style hub. Powered by StitchCraft Ghana.
                </motion.div>
            </section>

            {/* Grid: Asymmetric Bento Box */}
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6 md:auto-rows-[160px]">
                {/* Active Orders Card - Span 2x2 */}
                <motion.div
                    whileHover={{ y: -10 }}
                    className="md:col-span-2 md:row-span-3 bg-zinc-900/50 backdrop-blur-xl rounded-[3rem] p-8 border border-white/5 flex flex-col justify-between group cursor-pointer overflow-hidden relative"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ShoppingBag className="h-32 w-32 rotate-12" />
                    </div>
                    <div>
                        <Badge className="bg-ghana-gold text-ghana-black mb-6 px-4 py-1 font-black rounded-full uppercase tracking-tighter">
                            Live Progress
                        </Badge>
                        <h2 className="text-4xl font-black font-heading uppercase mb-2">Active <br /> Orders</h2>
                        <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">
                            {data.summary.activeOrders} orders in workshop
                        </p>
                    </div>
                    <Link href="/studio/orders" className="flex items-center gap-2 text-ghana-gold font-black group-hover:gap-4 transition-all">
                        Track Everything <ArrowUpRight className="h-5 w-5" />
                    </Link>
                </motion.div>

                {/* Measurement Quick View - Span 2x2 */}
                <motion.div
                    whileHover={{ y: -10 }}
                    className="md:col-span-2 md:row-span-2 bg-zinc-900 border border-white/5 rounded-[3rem] p-8 flex flex-col justify-between overflow-hidden relative group"
                >
                    <div className="absolute bottom-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Ruler className="h-24 w-24 -rotate-12" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black font-heading uppercase mb-4">Measurements</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                <span className="text-zinc-500 text-xs font-bold uppercase">Last Sync</span>
                                <span className="font-bold text-sm">
                                    {data.summary.lastMeasurement ? new Date(data.summary.lastMeasurement).toLocaleDateString() : 'Never'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-zinc-500 text-xs font-bold uppercase">Status</span>
                                <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 bg-emerald-500/5 rounded-full px-3">Verified</Badge>
                            </div>
                        </div>
                    </div>
                    <Link href="/studio/measurements" className="mt-6 flex items-center gap-2 text-zinc-300 font-bold uppercase text-xs hover:text-white transition-colors">
                        View Details <ArrowUpRight className="h-4 w-4" />
                    </Link>
                </motion.div>

                {/* Wishlist Stats - Span 2x3 */}
                <motion.div
                    whileHover={{ y: -10 }}
                    className="md:col-span-2 md:row-span-3 bg-ghana-gold text-ghana-black rounded-[3rem] p-8 flex flex-col justify-between"
                >
                    <div>
                        <Star className="h-8 w-8 mb-8 fill-ghana-black shadow-2xl" />
                        <h3 className="text-5xl font-black font-heading leading-none uppercase mb-4">Style <br /> Curator</h3>
                        <p className="font-black text-2xl">
                            {data.wishlistCount} Saved <br /> Inspo Pieces
                        </p>
                    </div>
                    <Button className="w-full bg-ghana-black text-white rounded-2xl h-14 font-black uppercase tracking-widest text-xs" asChild>
                        <Link href="/studio/styles">Open Wishlist</Link>
                    </Button>
                </motion.div>

                {/* Recent Order Item - Large Bar */}
                <div className="md:col-span-4 lg:col-span-4 md:row-span-1 bg-white/5 rounded-[2rem] border border-white/5 flex items-center justify-between px-8 py-4 group hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-6">
                        <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center">
                            <Clock className="h-6 w-6 text-zinc-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Recently Updated</p>
                            <h4 className="font-bold">
                                {data.orders[0]?.garmentType || 'No recent orders'}
                            </h4>
                        </div>
                    </div>
                    {data.orders[0] && (
                        <Badge className="bg-white/10 text-zinc-300 font-bold uppercase tracking-tighter hover:bg-white/20">
                            {data.orders[0].status}
                        </Badge>
                    )}
                </div>
            </div>

            {/* Decorative Section: Quote or Branding */}
            <section className="pt-20 border-t border-white/5 grid grid-cols-1 lg:grid-cols-2 gap-16">
                <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.4em] text-zinc-600 mb-8 underline decoration-ghana-gold/50 underline-offset-8">The Philosophy</h3>
                    <p className="text-2xl font-heading leading-relaxed font-bold italic text-zinc-300">
                        "Fashion is not just what you wear, it's how you tell your story through every stitch, measurement, and curve."
                    </p>
                </div>
                <div className="flex justify-center items-center">
                    <div className="relative group cursor-none">
                        <div className="absolute -inset-4 bg-ghana-gold/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full scale-150" />
                        <div className="h-40 w-40 border-2 border-white/10 rounded-full flex items-center justify-center relative overflow-hidden">
                            <Layers className="h-12 w-12 text-zinc-800 animate-pulse" />
                            <div className="absolute inset-0 border-[1px] border-ghana-gold/30 rounded-full animate-spin-slow" />
                        </div>
                        <div className="mt-8 text-center">
                            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-ghana-gold">Authentic StitchCraft</span>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

function LinkAccountDialog() {
    const [open, setOpen] = React.useState(false);
    const [token, setToken] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');

    async function handleLink() {
        if (!token) return;
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/studio/link-account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to link account');

            window.location.reload();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="lg" className="rounded-2xl h-16 px-12 text-lg font-black bg-ghana-gold text-ghana-black hover:bg-ghana-gold/90">
                    Enter Tracking Token
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Link Your Account</DialogTitle>
                    <DialogDescription>
                        Enter the tracking token provided by your tailor to connect your account.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="token">Tracking Token</Label>
                        <Input
                            id="token"
                            placeholder="e.g. TRK-123456"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                        />
                    </div>
                    {error && <p className="text-destructive text-sm font-bold">{error}</p>}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">Cancel</Button>
                    <Button onClick={handleLink} disabled={loading || !token} className="bg-ghana-gold text-ghana-black rounded-xl">
                        {loading ? 'Linking...' : 'Link Account'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

