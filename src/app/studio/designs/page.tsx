'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Image as ImageIcon, Loader2, Plus, Trash2, UploadCloud } from 'lucide-react';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { fetchApi } from '@/lib/fetch-api';
import { cn } from '@/lib/utils';

const GARMENT_TYPES = [
  { value: 'KABA_AND_SLIT', label: 'Kaba & Slit' },
  { value: 'DASHIKI', label: 'Dashiki' },
  { value: 'SMOCK_BATAKARI', label: 'Smock/Batakari' },
  { value: 'KAFTAN', label: 'Kaftan' },
  { value: 'AGBADA', label: 'Agbada' },
  { value: 'COMPLET', label: 'Complet' },
  { value: 'KENTE_CLOTH', label: 'Kente Cloth' },
  { value: 'BOUBOU', label: 'Boubou' },
  { value: 'SUIT', label: 'Suit' },
  { value: 'DRESS', label: 'Dress' },
  { value: 'SHIRT', label: 'Shirt' },
  { value: 'TROUSERS', label: 'Trousers' },
  { value: 'SKIRT', label: 'Skirt' },
  { value: 'BLOUSE', label: 'Blouse' },
  { value: 'OTHER', label: 'Other' },
];

interface ClientDesign {
  id: string;
  images: string[];
  notes: string | null;
  garmentType: string | null;
  createdAt: string;
}

interface DesignMeta {
  count: number;
  limit: number;
  remaining: number;
}

export default function StudioDesignsPage() {
  const queryClient = useQueryClient();
  const {
    data: designsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['client', 'designs'],
    queryFn: async () => {
      const res = await fetchApi('/api/client/designs');
      if (!res.ok) throw new Error('Failed to fetch designs');
      return res.json();
    },
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [garmentType, setGarmentType] = useState('OTHER');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [designToDelete, setDesignToDelete] = useState<ClientDesign | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select an image');
      return;
    }

    try {
      setUploading(true);

      // 1. Upload Image
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('folder', 'client-designs');

      const uploadRes = await fetchApi('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) throw new Error('Failed to upload image');
      const uploadData = await uploadRes.json();

      // 2. Create Design Record
      const designRes = await fetchApi('/api/client/designs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: [uploadData.url],
          notes,
          garmentType,
        }),
      });

      const designResult = await designRes.json();

      if (!designRes.ok) {
        if (designResult.code === 'DESIGN_LIMIT_REACHED') {
          toast.error('Design Limit Reached', {
            description: designResult.error,
          });
        } else {
          throw new Error('Failed to save design');
        }
        return;
      }

      toast.success('Design added successfully!');
      setIsDialogOpen(false);
      resetForm();
      refetch();
    } catch (error) {
      console.error(error);
      toast.error('Operation failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteClick = (design: ClientDesign) => {
    setDesignToDelete(design);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!designToDelete) return;

    try {
      setDeleting(true);
      const res = await fetchApi(`/api/client/designs/${designToDelete.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete design');
      }

      toast.success('Design deleted successfully');
      setDeleteDialogOpen(false);
      setDesignToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['client', 'designs'] });
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete design. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setNotes('');
    setGarmentType('OTHER');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const designs: ClientDesign[] = designsData?.data || [];
  const meta: DesignMeta | undefined = designsData?.meta;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-ghana-gold" />
      </div>
    );
  }

  const isAtLimit = meta && meta.remaining === 0;
  const isNearLimit = meta && meta.remaining <= 2 && meta.remaining > 0;

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
        <div>
          <span className="text-secondary font-black uppercase tracking-[0.3em] text-[10px] mb-4 block">
            Personal Portfolio
          </span>
          <h1 className="text-5xl md:text-7xl font-black font-heading tracking-tighter uppercase italic leading-none">
            Your <br /> Designs.
          </h1>
          {meta && (
            <div className="mt-4 flex items-center gap-3">
              <Badge
                variant="outline"
                className={cn(
                  'rounded-full px-3 py-1 font-bold text-[10px] uppercase tracking-widest',
                  isAtLimit
                    ? 'border-red-500/50 text-red-400'
                    : isNearLimit
                      ? 'border-amber-500/50 text-amber-400'
                      : 'border-white/10 text-zinc-500'
                )}
              >
                {meta.count} / {meta.limit} Designs
              </Badge>
              {isNearLimit && (
                <span className="text-amber-400 text-[10px] font-bold uppercase tracking-widest">
                  {meta.remaining} slots remaining
                </span>
              )}
            </div>
          )}
        </div>
        <div>
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              if (isAtLimit && open) {
                toast.error('Design Limit Reached', {
                  description: 'Delete some designs to upload new ones.',
                });
                return;
              }
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button
                className={cn(
                  'rounded-2xl h-14 font-black uppercase tracking-widest text-[10px] px-8',
                  isAtLimit
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    : 'bg-ghana-gold text-ghana-black hover:bg-ghana-gold/90'
                )}
                disabled={isAtLimit}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Design
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-heading uppercase text-xl">Upload Design</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 pt-4">
                {/* Image Upload */}
                <div className="space-y-2">
                  <Label className="text-xs uppercase font-bold tracking-widest text-zinc-500">
                    Design Image
                  </Label>
                  <button
                    type="button"
                    className={cn(
                      'border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center bg-white/5 cursor-pointer hover:bg-white/10 transition-colors relative overflow-hidden',
                      previewUrl ? 'border-solid border-ghana-gold/50' : ''
                    )}
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Upload design image"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileSelect}
                    />

                    {previewUrl ? (
                      <>
                        <Image
                          src={previewUrl}
                          alt="Preview"
                          fill
                          className="object-cover absolute inset-0"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                          <p className="text-xs font-bold uppercase tracking-widest">
                            Change Image
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="h-10 w-10 text-zinc-500 mb-2" />
                        <p className="text-xs font-bold text-zinc-400">Click to upload</p>
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase font-bold tracking-widest text-zinc-500">
                    Category
                  </Label>
                  <Select value={garmentType} onValueChange={setGarmentType}>
                    <SelectTrigger className="bg-white/5 border-white/10 h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10">
                      {GARMENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase font-bold tracking-widest text-zinc-500">
                    Notes for Tailor
                  </Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Specific instructions or details..."
                    className="bg-white/5 border-white/10 min-h-[100px] resize-none"
                  />
                </div>

                <DialogFooter>
                  <Button
                    onClick={handleUpload}
                    disabled={uploading || !selectedFile}
                    className="w-full bg-ghana-gold text-ghana-black hover:bg-ghana-gold/90 font-black uppercase tracking-widest h-12"
                  >
                    {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {uploading ? 'Uploading...' : 'Save Design'}
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Limit Warning Banner */}
      {isAtLimit && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 flex items-center gap-4">
          <AlertTriangle className="h-6 w-6 text-red-400 flex-shrink-0" />
          <div>
            <p className="font-bold text-red-400">Design Limit Reached</p>
            <p className="text-sm text-red-300/70">
              You have reached the maximum of {meta?.limit} designs. Delete some designs to upload
              new ones.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence>
          {designs.map((design: ClientDesign) => (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={design.id}
              layout
              className="group relative bg-zinc-900 border border-white/5 rounded-[2.5rem] overflow-hidden"
            >
              <div className="aspect-[4/5] relative">
                <Image
                  src={design.images[0] || '/placeholder-garment.jpg'}
                  alt={design.garmentType || 'Design Image'}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md rounded-full px-3 py-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">
                    {design.garmentType ? design.garmentType.replace(/_/g, ' ') : 'Design'}
                  </span>
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => handleDeleteClick(design)}
                  className="absolute top-4 left-4 h-10 w-10 bg-red-500/80 hover:bg-red-500 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Delete design"
                >
                  <Trash2 className="h-4 w-4 text-white" />
                </button>
              </div>

              <div className="p-6">
                {design.notes ? (
                  <p className="text-sm text-zinc-400 font-medium italic line-clamp-3">
                    "{design.notes}"
                  </p>
                ) : (
                  <p className="text-sm text-zinc-600 font-bold uppercase tracking-widest">
                    No notes added
                  </p>
                )}

                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-600">
                  <span>Added {new Date(design.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {designs.length === 0 && (
          <div className="col-span-full py-40 border-2 border-dashed border-white/5 rounded-[3rem] flex flex-col items-center justify-center text-center">
            <div className="h-20 w-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
              <ImageIcon className="h-10 w-10 text-zinc-800" />
            </div>
            <h3 className="text-xl font-black font-heading uppercase mb-2">No designs yet</h3>
            <p className="text-zinc-600 font-bold uppercase tracking-widest text-xs">
              Upload photos of styles you want made.
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-zinc-950 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white font-heading uppercase">
              Delete Design?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This action cannot be undone. The design will be permanently removed from your
              portfolio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-white/10 text-white hover:bg-zinc-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
