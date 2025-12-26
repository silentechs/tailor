'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Image as ImageIcon, Loader2, Plus, Trash2, Upload, X, MoreVertical, Edit } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { VoiceInput } from '@/components/ui/voice-input';
import { fetchApi } from '@/lib/fetch-api';
import { suggestTagsForGarment } from '@/lib/ai-logic';
import { GARMENT_TYPE_LABELS } from '@/lib/utils';
import { EyeOff } from 'lucide-react';

// API Functions
async function getPortfolio() {
  const res = await fetchApi('/api/portfolio');
  if (!res.ok) throw new Error('Failed to fetch portfolio');
  const data = await res.json();
  return data.data;
}

async function createPortfolioItem(data: any) {
  const res = await fetchApi('/api/portfolio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create item');
  }
  return res.json();
}

async function deletePortfolioItem(id: string) {
  const res = await fetchApi(`/api/portfolio/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete item');
  return res.json();
}

async function updatePortfolioVisibility(id: string, isPublic: boolean) {
  const res = await fetchApi(`/api/portfolio/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isPublic }),
  });
  if (!res.ok) throw new Error('Failed to update visibility');
  return res.json();
}

async function updatePortfolioItem(id: string, data: any) {
  const res = await fetchApi(`/api/portfolio/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update item');
  }
  return res.json();
}

export default function PortfolioPage() {
  const queryClient = useQueryClient();
  const [_activeTab, setActiveTab] = useState('gallery');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({
    title: '',
    category: '',
    description: '',
    images: ['/placeholder.jpg'],
    tags: [] as string[],
    isPublic: true,
    isFeatured: false,
  });

  const {
    data: portfolio,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['portfolio'],
    queryFn: getPortfolio,
  });

  const createMutation = useMutation({
    mutationFn: createPortfolioItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      setIsAddOpen(false);
      setNewItem({
        title: '',
        category: '',
        description: '',
        images: ['/placeholder.jpg'],
        tags: [],
        isPublic: true,
        isFeatured: false,
      });
      toast.success('Project added to portfolio');
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePortfolioItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      toast.success('Project removed from portfolio');
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updatePortfolioItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      setIsAddOpen(false);
      setEditingId(null);
      setNewItem({
        title: '',
        category: '',
        description: '',
        images: ['/placeholder.jpg'],
        tags: [],
        isPublic: true,
        isFeatured: false,
      });
      toast.success('Project updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: ({ id, isPublic }: { id: string; isPublic: boolean }) =>
      updatePortfolioVisibility(id, isPublic),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      toast.success('Visibility updated');
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File is too large. Max 5MB.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    const loadingToast = toast.loading('Uploading image...');

    try {
      const res = await fetchApi('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      const data = await res.json();

      setNewItem((prev) => ({
        ...prev,
        images: [...prev.images.filter((img) => img !== '/placeholder.jpg'), data.url],
      }));

      toast.dismiss(loadingToast);
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Failed to upload image');
      console.error(error);
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setNewItem((prev) => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove),
    }));
  };

  const handleSave = () => {
    if (!newItem.title || !newItem.category) {
      toast.error('Please fill in all required fields');
      return;
    }
    // Remove placeholder if still present
    const cleanImages = newItem.images.filter((img) => img !== '/placeholder.jpg');

    if (cleanImages.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        data: {
          ...newItem,
          images: cleanImages,
        },
      });
    } else {
      createMutation.mutate({
        ...newItem,
        images: cleanImages,
      });
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setNewItem({
      title: item.title,
      category: item.category,
      description: item.description || '',
      images: item.images && item.images.length > 0 ? item.images : ['/placeholder.jpg'],
      tags: item.tags || [],
      isPublic: item.isPublic ?? true,
      isFeatured: item.isFeatured ?? false,
    });
    setIsAddOpen(true);
  };

  // Analytics Calculations
  const totalViews = portfolio
    ? portfolio.reduce((acc: number, item: any) => acc + (item.viewCount || 0), 0)
    : 0;
  const totalLikes = portfolio
    ? portfolio.reduce((acc: number, item: any) => acc + (item.likeCount || 0), 0)
    : 0;
  const totalProjects = portfolio ? portfolio.length : 0;

  // Group by category
  const categoryStats = portfolio
    ? portfolio.reduce((acc: any, item: any) => {
      const cat = item.category;
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {})
    : {};

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading text-primary">Portfolio</h1>
          <p className="text-muted-foreground">Showcase your best work to potential clients.</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Project
        </Button>
      </div>

      <Tabs defaultValue="gallery" className="w-full" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="gallery" className="mt-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">
              Error loading portfolio. Please try again.
            </div>
          ) : !portfolio || portfolio.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Your portfolio is empty</h3>
              <p className="text-muted-foreground mb-4">
                Start adding photos of your work to attract clients.
              </p>
              <Button onClick={() => setIsAddOpen(true)}>Add First Project</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {portfolio.map((item: any) => (
                <Card key={item.id} className="overflow-hidden group relative">
                  <Dialog>
                    {/* Make the entire image area a trigger for the dialog */}
                    <div className="relative aspect-square bg-muted">
                      <DialogTrigger asChild>
                        <div className="absolute inset-0 flex items-center justify-center bg-secondary/10 text-muted-foreground cursor-pointer">
                          {item.images && item.images.length > 0 ? (
                            <img
                              src={item.images[0]}
                              alt={item.title}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <ImageIcon className="h-10 w-10" />
                          )}
                        </div>
                      </DialogTrigger>

                      {/* Mobile Actions Menu (Visible on md and below) */}
                      <div className="absolute top-2 right-2 md:hidden">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full shadow-md bg-white/90 backdrop-blur-sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(item)}>
                              <Edit className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleVisibilityMutation.mutate({ id: item.id, isPublic: !item.isPublic })}>
                              {item.isPublic ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                              {item.isPublic ? 'Make Private' : 'Make Public'}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteConfirmId(item.id)}>
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Desktop Hover Overlay (Hidden on mobile) */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center justify-center gap-2 pointer-events-none group-hover:pointer-events-auto">
                        <DialogTrigger asChild>
                          <Button variant="secondary" size="sm">
                            <Eye className="h-4 w-4 mr-2" /> View
                          </Button>
                        </DialogTrigger>

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            toggleVisibilityMutation.mutate({ id: item.id, isPublic: !item.isPublic })
                          }
                        >
                          {item.isPublic ? (
                            <Eye className="h-4 w-4 mr-2" />
                          ) : (
                            <EyeOff className="h-4 w-4 mr-2" />
                          )}
                          {item.isPublic ? 'Public' : 'Private'}
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => handleEdit(item)}>
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteConfirmId(item.id)}
                          disabled={deleteMutation.isPending}
                        >
                          {deleteMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-2" />
                          )}
                          Delete
                        </Button>
                      </div>
                    </div>

                    <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{item.title}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                          {item.images && item.images.length > 0 ? (
                            <img
                              src={item.images[0]}
                              alt={item.title}
                              className="object-contain w-full h-full"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <ImageIcon className="h-20 w-20 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {GARMENT_TYPE_LABELS[
                              item.category as keyof typeof GARMENT_TYPE_LABELS
                            ] || item.category}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {item.viewCount} views • {item.likeCount} likes
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>

                  <ConfirmDialog
                    open={deleteConfirmId === item.id}
                    onOpenChange={(open) => !open && setDeleteConfirmId(null)}
                    title="Delete Project"
                    description="Are you sure you want to remove this project from your portfolio? This action cannot be undone."
                    confirmText="Delete"
                    variant="destructive"
                    onConfirm={() => {
                      deleteMutation.mutate(item.id);
                      setDeleteConfirmId(null);
                    }}
                    isLoading={deleteMutation.isPending}
                  />

                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg truncate pr-2">{item.title}</CardTitle>
                      <div className="flex gap-2 items-center">
                        {!item.isPublic && (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">
                            Private
                          </Badge>
                        )}
                        <Badge variant="outline" className="shrink-0">
                          {GARMENT_TYPE_LABELS[item.category as keyof typeof GARMENT_TYPE_LABELS] ||
                            item.category}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex gap-4 text-sm text-muted-foreground mt-2">
                      <span>{item.viewCount} views</span>
                      <span>{item.likeCount} likes</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <div className="grid gap-6 md:grid-cols-3 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalProjects}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Views
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalViews}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Likes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalLikes}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Projects by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(categoryStats).map(([cat, count]: [string, any]) => (
                  <div key={cat} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {GARMENT_TYPE_LABELS[cat as keyof typeof GARMENT_TYPE_LABELS] || cat}
                      </Badge>
                    </div>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
                {Object.keys(categoryStats).length === 0 && (
                  <p className="text-muted-foreground text-sm">No data available yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Project Dialog (Add/Edit) */}
      <Dialog
        open={isAddOpen}
        onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) {
            setEditingId(null);
            setNewItem({
              title: '',
              category: '',
              description: '',
              images: ['/placeholder.jpg'],
              tags: [],
              isPublic: true,
              isFeatured: false,
            });
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Project' : 'Add New Project'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Project Title</Label>
              <Input
                id="title"
                placeholder="e.g. Wedding Kente"
                value={newItem.title}
                onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select
                onValueChange={(val) => {
                  const suggestedTags = suggestTagsForGarment(val);
                  setNewItem({
                    ...newItem,
                    category: val,
                    tags: [...new Set([...newItem.tags, ...suggestedTags])]
                  });
                }}
                value={newItem.category}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(GARMENT_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description">Description</Label>
                <VoiceInput
                  onTranscript={(text) => {
                    setNewItem((prev) => ({
                      ...prev,
                      description: prev.description ? `${prev.description} ${text}` : text,
                    }));
                  }}
                  placeholder="Describe your work..."
                />
              </div>
              <Textarea
                id="description"
                placeholder="Describe the materials, techniques used..."
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {newItem.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1 px-2 py-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() =>
                        setNewItem({ ...newItem, tags: newItem.tags.filter((t) => t !== tag) })
                      }
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add tag..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = e.currentTarget.value.trim();
                      if (val && !newItem.tags.includes(val)) {
                        setNewItem({ ...newItem, tags: [...newItem.tags, val] });
                        e.currentTarget.value = '';
                      }
                    }
                  }}
                />
              </div>
              {newItem.category && (
                <div className="mt-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                    AI Suggestions for {GARMENT_TYPE_LABELS[newItem.category] || newItem.category}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestTagsForGarment(newItem.category)
                      .filter((t) => !newItem.tags.includes(t))
                      .map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setNewItem({ ...newItem, tags: [...newItem.tags, tag] })}
                          className="text-[10px] bg-primary/5 hover:bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/10 transition-colors"
                        >
                          + {tag}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label>Photos</Label>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {newItem.images
                  .filter((img) => img !== '/placeholder.jpg')
                  .map((img, index) => (
                    <div
                      key={img}
                      className="relative aspect-square rounded-md overflow-hidden border group"
                    >
                      <img src={img} alt="Preview" className="object-cover w-full h-full" />
                      <button
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-1 right-1 bg-destructive text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        type="button"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                <label className="border-2 border-dashed rounded-lg aspect-square flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                  <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                  <span className="text-xs text-muted-foreground">Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : editingId ? (
                'Update Project'
              ) : (
                'Save Project'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
