'use client';

import { useState, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, UploadCloud, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Image from 'next/image';

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

export function ClientDesignUploadDialog() {
    const [open, setOpen] = useState(false);
    const [clientId, setClientId] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [notes, setNotes] = useState('');
    const [garmentType, setGarmentType] = useState('OTHER');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();

    useEffect(() => {
        const handleOpen = (e: CustomEvent) => {
            setClientId(e.detail.clientId);
            setOpen(true);
            resetForm();
        };

        window.addEventListener('open-design-upload' as any, handleOpen);
        return () => window.removeEventListener('open-design-upload' as any, handleOpen);
    }, []);

    const resetForm = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setNotes('');
        setGarmentType('OTHER');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleUpload = async () => {
        if (!selectedFile || !clientId) {
            toast.error('Please select an image');
            return;
        }

        try {
            setUploading(true);

            // 1. Upload Image
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('folder', 'client-designs');

            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!uploadRes.ok) throw new Error('Failed to upload image');
            const uploadData = await uploadRes.json();

            // 2. Create Design Record linked to Client
            const designRes = await fetch(`/api/clients/${clientId}/designs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    images: [uploadData.url],
                    notes,
                    garmentType,
                }),
            });

            if (!designRes.ok) throw new Error('Failed to save design');

            toast.success('Design added successfully!');
            setOpen(false);

            // Invalidate queries to refresh the list
            queryClient.invalidateQueries({ queryKey: ['client', clientId] });

            // Force reload for now as fallback
            window.location.reload();

        } catch (error) {
            console.error(error);
            toast.error('Operation failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Upload Reference / Design</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 pt-4">
                    <div className="space-y-2">
                        <Label>Design Image</Label>
                        <div
                            className={cn(
                                "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors relative overflow-hidden h-48",
                                previewUrl ? "border-solid border-primary" : ""
                            )}
                            onClick={() => fileInputRef.current?.click()}
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
                                        className="object-contain p-2"
                                    />
                                </>
                            ) : (
                                <>
                                    <UploadCloud className="h-10 w-10 text-muted-foreground mb-2" />
                                    <p className="text-xs font-bold text-muted-foreground">Click to select image</p>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Category</Label>
                        <Select value={garmentType} onValueChange={setGarmentType}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {GARMENT_TYPES.map(type => (
                                    <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Any specific instructions..."
                            className="bg-background resize-none"
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            onClick={handleUpload}
                            disabled={uploading || !selectedFile}
                            className="w-full"
                        >
                            {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {uploading ? 'Uploading...' : 'Save Design'}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
