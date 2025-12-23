'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { jsPDF } from 'jspdf';
import { CheckCircle, FileText, HelpCircle, History, Info, Loader2, Ruler } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MeasurementDialog } from './measurement-dialog';

export default function StudioMeasurementsPage() {
  const { data: mData, isLoading } = useQuery({
    queryKey: ['studio', 'measurements'],
    queryFn: async () => {
      const res = await fetch('/api/studio/measurements');
      if (!res.ok) throw new Error('Failed to fetch measurements');
      return res.json();
    },
  });

  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text('StitchCraft Studio', 20, 20);
    doc.setFontSize(12);
    doc.text('Measurement Profile', 20, 30);

    const latest = mData?.data?.latest;
    if (latest) {
      doc.text(`Date: ${new Date(latest.createdAt).toLocaleDateString()}`, 20, 40);
      const values = latest.values || {};

      let y = 60;
      doc.setFontSize(14);
      doc.text(`Current Measurements (${latest.unit || 'CM'}):`, 20, 50);
      doc.setFontSize(12);

      Object.entries(values).forEach(([key, val]: [string, any]) => {
        doc.text(`${key}: ${val} ${latest.unit?.toLowerCase() || 'cm'}`, 20, y);
        y += 10;
      });

      if (latest.notes) {
        y += 10;
        doc.text('Notes:', 20, y);
        doc.setFontSize(10);
        const splitNotes = doc.splitTextToSize(latest.notes, 170);
        doc.text(splitNotes, 20, y + 10);
      }
    }

    doc.save('stitchcraft-measurements.pdf');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-ghana-gold" />
      </div>
    );
  }

  const { latest, history } = mData?.data || {};
  const values = latest?.values || {};

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-secondary font-black uppercase tracking-[0.3em] text-[10px] mb-4 block">
              Precision Control
            </span>
            <h1 className="text-5xl md:text-7xl font-black font-heading tracking-tighter uppercase italic leading-none">
              Fitting <br /> Profile.
            </h1>
          </div>
          <Link
            href="/studio/help/measurements"
            className="p-3 rounded-2xl bg-white/5 text-ghana-gold hover:bg-white/10 transition-colors border border-white/5 self-end mb-2"
            title="View Measurements Help Guide"
          >
            <HelpCircle className="h-6 w-6" />
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <MeasurementDialog initialValues={values} />
          <Button
            onClick={handleDownloadPDF}
            className="rounded-2xl h-14 bg-ghana-gold text-ghana-black hover:bg-ghana-gold/90 font-black uppercase tracking-widest text-[10px] px-8"
          >
            Download PDF
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Latest Measurements - Main View */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-[3rem] overflow-hidden">
            <div className="p-8 lg:p-12 border-b border-white/5 bg-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-3xl font-black font-heading uppercase">Current Set</h2>
                  <Badge className="bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30 border-none rounded-full px-3 py-1 font-black text-[10px] uppercase">
                    Active
                  </Badge>
                </div>
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">
                  Verified on {latest ? new Date(latest.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div className="h-16 w-16 rounded-2xl bg-zinc-800 flex items-center justify-center">
                <Ruler className="h-8 w-8 text-ghana-gold" />
              </div>
            </div>

            <div className="p-8 lg:p-12">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-8 gap-y-12">
                {Object.entries(values).map(([key, val]: [string, any]) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    key={key}
                    className="group"
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2 group-hover:text-ghana-gold transition-colors">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black font-heading text-white">{val}</span>
                      <span className="text-xs font-bold text-zinc-500">{latest.unit || 'CM'}</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {!latest && (
                <div className="py-20 text-center">
                  <Info className="h-12 w-12 text-zinc-800 mx-auto mb-4" />
                  <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">
                    No measurements found for your profile
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Style Advice / Notes Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="bg-ghana-gold text-ghana-black border-none rounded-[2.5rem] p-4">
              <CardHeader>
                <CardTitle className="text-xl font-black font-heading uppercase">
                  Tailor Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-ghana-black/70 font-bold leading-relaxed italic">
                  {latest?.notes ||
                    'No special tailoring notes at this time. Your profile is optimized for standard formal cuts.'}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900 border-white/5 rounded-[2.5rem] p-4">
              <CardHeader>
                <CardTitle className="text-xl font-black font-heading uppercase text-white">
                  Advice
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-500 font-bold leading-relaxed">
                  Based on your shoulder-to-chest ratio, we recommend **Structured Shoulders** for
                  all blazers and coats.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar: History & Meta */}
        <div className="space-y-8">
          <section className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-8">
            <h3 className="text-xl font-black font-heading uppercase mb-8 flex items-center gap-3">
              <History className="h-5 w-5 text-ghana-gold" />
              History
            </h3>
            <div className="space-y-6">
              {history?.map((h: any, idx: number) => (
                <div
                  key={h.id}
                  className="group relative pl-6 border-l border-white/10 pb-6 last:pb-0"
                >
                  <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-zinc-800 group-hover:bg-ghana-gold transition-colors" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">
                    {new Date(h.createdAt).toLocaleDateString()}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm tracking-tight italic">
                      Fitting Session #{history.length - idx}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full hover:bg-white/5"
                    >
                      <FileText className="h-4 w-4 text-zinc-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-ghana-black border border-white/10 rounded-[2.5rem] p-8 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
              <CheckCircle className="h-24 w-24" />
            </div>
            <h3 className="text-xl font-black font-heading uppercase mb-4 text-white">
              Validation
            </h3>
            <p className="text-zinc-500 text-sm font-bold leading-relaxed mb-6">
              Your measurements are verified and ready for new orders. No seasonal updates required.
            </p>
            <div className="flex items-center gap-4 text-emerald-500 font-black text-xs uppercase tracking-widest">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Profile Ready
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
