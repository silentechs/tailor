'use client';

import { KenteBackground } from '@/components/landing/kente-background';
import { Navbar } from '@/components/landing/navbar';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-32 pb-20">
        <KenteBackground />
        <div className="container mx-auto px-4 relative z-10 max-w-4xl">
          <div className="space-y-12">
            <header className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-black font-heading text-slate-900 tracking-tight">
                Privacy <span className="text-primary italic">Policy</span>
              </h1>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">
                Effective Date: December 20, 2025
              </p>
            </header>

            <article className="prose prose-slate prose-lg max-w-none text-slate-600 leading-relaxed font-medium">
              <p>
                At **StitchCraft Ghana**, a product of **Silentech Solution Limited**, we respect
                the ancient craft of tailoring and the modern boundaries of digital privacy. This
                policy outlines how we handle your business and personal data.
              </p>

              <h2 className="text-2xl font-bold text-slate-900 font-heading pt-8">
                1. Data We Collect
              </h2>
              <p>
                We collect information necessary to manage your workshop: - **Personal Details**:
                Name, email, phone number. - **Business Details**: Workshop name, location,
                portfolio images. - **Client Data**: Measurements and order history captured within
                the app.
              </p>

              <h2 className="text-2xl font-bold text-slate-900 font-heading pt-8">
                2. How We Use Data
              </h2>
              <p>
                Your data is used to provide the StitchCraft service, optimize production workflows,
                and facilitate client communication via the Tracking Portal. We never sell your
                measurements or style references to third parties.
              </p>

              <h2 className="text-2xl font-bold text-slate-900 font-heading pt-8">
                3. Social Media Consent
              </h2>
              <p>
                Showcasing is vital for growth. However, we only allow public display of client
                garments if explicit digital consent is recorded in the Client Tracking Portal for
                each specific order.
              </p>

              <h2 className="text-2xl font-bold text-slate-900 font-heading pt-8">4. Security</h2>
              <p>
                We utilize enterprise-grade encryption (SSL/TLS) for all data in transit and at
                rest. Your measurements are stored in our secure "Design Vault" protected by
                advanced authentication protocols.
              </p>

              <h2 className="text-2xl font-bold text-slate-900 font-heading pt-8">5. Contact</h2>
              <p>For privacy inquiries, please contact: **support@silentech.live**</p>
            </article>
          </div>
        </div>
      </main>
    </div>
  );
}
