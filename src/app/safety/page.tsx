'use client';

import { Navbar } from '@/components/landing/navbar';
import { KenteBackground } from '@/components/landing/kente-background';
import { ShieldCheck, Lock, UserCheck, AlertTriangle } from 'lucide-react';

export default function SafetyPage() {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="pt-32 pb-20">
                <KenteBackground />
                <div className="container mx-auto px-4 relative z-10 max-w-4xl">
                    <div className="space-y-12">
                        <header className="space-y-4">
                            <h1 className="text-5xl md:text-6xl font-black font-heading text-slate-900 tracking-tight">Platform <span className="text-primary italic">Safety</span></h1>
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Building Trust in Ghanaian Fashion</p>
                        </header>

                        <div className="prose prose-slate prose-lg max-w-none text-slate-600 leading-relaxed font-medium">
                            <p className="text-xl leading-relaxed text-slate-700">
                                At StitchCraft, we are committed to creating a safe, trustworthy environment for both artisans and clients. Our safety protocols are designed to protect your business, your payments, and your personal interactions.
                            </p>

                            <div className="grid md:grid-cols-2 gap-8 not-prose mt-12">
                                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-4">
                                    <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                        <UserCheck className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900">Artisan Verification</h3>
                                    <p className="text-slate-600 text-sm">Every tailor on our "Discover" platform undergoes a review process. We verify business locations and identities to ensure clients are connecting with real, professional craftspeople.</p>
                                </div>

                                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-4">
                                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                        <Lock className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900">Secure Data</h3>
                                    <p className="text-slate-600 text-sm">Your client measurements and proprietary designs are your intellectual property. They are stored in encrypted databases and are never shared without your explicit permission.</p>
                                </div>
                            </div>

                            <h2 className="text-2xl font-bold text-slate-900 font-heading pt-8 flex items-center gap-2">
                                <ShieldCheck className="text-primary h-6 w-6" />
                                Best Practices for Fittings
                            </h2>
                            <p>
                                While StitchCraft facilitates the digital management of your business, physical fittings are the heart of tailoring. We recommend the following safety measures:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 marker:text-primary">
                                <li><strong>Meet in Professional Spaces:</strong> Conduct fittings in your registered workshop or a public location whenever possible.</li>
                                <li><strong>Clear Communication:</strong> confirm appointment details through the Client Portal to maintain a digital record of interactions.</li>
                                <li><strong>Respectful Conduct:</strong> We have a zero-tolerance policy for harassment or discrimination from either artisans or clients.</li>
                            </ul>

                            <h2 className="text-2xl font-bold text-slate-900 font-heading pt-8 flex items-center gap-2">
                                <AlertTriangle className="text-amber-500 h-6 w-6" />
                                Reporting Suspicious Activity
                            </h2>
                            <p>
                                If you encounter any suspicious behavior, fake accounts, or payment irregularities, please report them immediately.
                            </p>
                            <p>
                                Email our Trust & Safety team: <strong className="text-primary">safety@stitchcraft.gh</strong>
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
