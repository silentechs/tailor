'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, Loader2, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { fetchApi } from '@/lib/fetch-api';

interface ProgressPhotosProps {
  orderId: string;
  initialPhotos?: string[];
}

export function ProgressPhotos({ orderId, initialPhotos = [] }: ProgressPhotosProps) {
  const queryClient = useQueryClient();
  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const [isUploading, setIsUploading] = useState(false);

  const updateMutation = useMutation({
    mutationFn: async (newPhotos: string[]) => {
      const res = await fetchApi(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progressPhotos: newPhotos }),
      });
      if (!res.ok) throw new Error('Failed to update progress photos');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      toast.success('Progress photos updated');
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newUploadedPhotos: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max 5MB.`);
        continue;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'orders');

      try {
        const res = await fetchApi('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) throw new Error('Upload failed');

        const data = await res.json();
        newUploadedPhotos.push(data.url);
      } catch (error) {
        toast.error(`Failed to upload ${file.name}`);
        console.error(error);
      }
    }

    if (newUploadedPhotos.length > 0) {
      const updatedPhotos = [...photos, ...newUploadedPhotos];
      setPhotos(updatedPhotos);
      updateMutation.mutate(updatedPhotos);
    }

    setIsUploading(false);
    // Reset input
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    const updatedPhotos = photos.filter((_, i) => i !== index);
    setPhotos(updatedPhotos);
    updateMutation.mutate(updatedPhotos);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-md font-bold flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary" />
          Progress Photos
        </CardTitle>
        <div className="relative">
          <input
            type="file"
            id="photo-upload"
            className="hidden"
            multiple
            accept="image/*"
            onChange={handleUpload}
            disabled={isUploading}
          />
          <Button variant="outline" size="sm" asChild disabled={isUploading}>
            <label htmlFor="photo-upload" className="cursor-pointer">
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Add Photos
            </label>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {photos.length === 0 ? (
          <div className="text-center py-6 border-2 border-dashed rounded-lg bg-muted/20">
            <Camera className="h-8 w-8 mx-auto text-muted-foreground opacity-50 mb-2" />
            <p className="text-sm text-muted-foreground">No progress photos yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-2">
            {photos.map((photo, index) => (
              <div
                key={photo}
                className="relative group aspect-square rounded-md overflow-hidden border bg-muted"
              >
                <img
                  src={photo}
                  alt={`Progress ${index + 1}`}
                  className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="secondary" size="icon" className="h-8 w-8">
                        <Camera className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <img src={photo} alt="Full size" className="w-full h-auto rounded-lg" />
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => removePhoto(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
