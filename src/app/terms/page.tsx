'use client';

import { Navbar } from '@/components/landing/navbar';
import { KenteBackground } from '@/components/landing/kente-background';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="pt-32 pb-20">
                <KenteBackground />
                <div className="container mx-auto px-4 relative z-10 max-w-4xl">
                    <div className="space-y-12">
                        <header className="space-y-4">
                            <h1 className="text-5xl md:text-6xl font-black font-heading text-slate-900 tracking-tight">Terms of <span className="text-primary italic">Service</span></h1>
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Last Updated: December 20, 2025</p>
                        </header>

                        <article className="prose prose-slate prose-lg max-w-none text-slate-600 leading-relaxed font-medium">
                            <p>
                                Welcome to **StitchCraft**. By accessing or using our platform, you agree to be bound by these terms. If you do not agree, please do not use the service.
                            </p>

                            <h2 className="text-2xl font-bold text-slate-900 font-heading pt-8">1. License to Use</h2>
                            <p>
                                We grant you a non-transferable, non-exclusive license to use the StitchCraft platform for your professional tailoring or fashion business operations within the Republic of Ghana and beyond.
                            </p>

                            <h2 className="text-2xl font-bold text-slate-900 font-heading pt-8">2. Account Responsibility</h2>
                            <p>
                                You are responsible for maintaining the confidentiality of your credentials. Any orders, measurements, or financial records created under your account are your legal responsibility.
                            </p>

                            <h2 className="text-2xl font-bold text-slate-900 font-heading pt-8">3. Fair Usage</h2>
                            <p>
                                The platform is designed for legitimate business use. Spamming, scraping, or attempting to compromise the "Measurement Engine" is strictly prohibited and will result in immediate suspension.
                            </p>

                            <h2 className="text-2xl font-bold text-slate-900 font-heading pt-8">4. Payments & Fees</h2>
                            <p>
                                StitchCraft may charge transaction fees or subscription costs for advanced workshop tools. All fees are non-refundable unless otherwise specified in accordance with Ghanaian consumer protection laws.
                            </p>

                            <h2 className="text-2xl font-bold text-slate-900 font-heading pt-8">5. Heritage Tech Rights</h2>
                            <p>
                                "StitchCraft" and its "Heritage Tech" design system are intellectual property. You retain ownership of your customer data and photos, but grant us a license to host and display them as requested via the Showcase features.
                            </p>
                        </article>
                    </div>
                </div>
            </main>
        </div>
    );
}
