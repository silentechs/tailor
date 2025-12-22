'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface PortfolioItem {
  id: string;
  title: string;
  description?: string;
  category: string;
  images: string[];
  viewCount: number;
  likeCount: number;
  isPublic: boolean;
}

export function usePortfolio() {
  return useQuery<PortfolioItem[]>({
    queryKey: ['portfolio'],
    queryFn: async () => {
      const res = await fetch('/api/portfolio');
      if (!res.ok) throw new Error('Failed to fetch portfolio');
      const data = await res.json();
      return data.data;
    },
  });
}

export function usePortfolioMutation() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (newItem: Partial<PortfolioItem>) => {
      const res = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create item');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      toast.success('Project added to portfolio');
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/portfolio/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete item');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      toast.success('Project removed from portfolio');
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const togglePublicMutation = useMutation({
    mutationFn: async ({ id, isPublic }: { id: string; isPublic: boolean }) => {
      const res = await fetch(`/api/portfolio/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic }),
      });
      if (!res.ok) throw new Error('Failed to update visibility');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    },
  });

  return {
    createMutation,
    deleteMutation,
    togglePublicMutation,
  };
}

export function useGlobalGallery() {
  return useQuery({
    queryKey: ['gallery', 'global'],
    queryFn: async () => {
      const res = await fetch('/api/gallery');
      if (!res.ok) throw new Error('Failed to fetch gallery');
      const data = await res.json();
      return data.data;
    },
  });
}

export function useDiscover() {
  return useQuery({
    queryKey: ['discover'],
    queryFn: async () => {
      const res = await fetch('/api/discover');
      if (!res.ok) throw new Error('Failed to fetch tailors');
      const data = await res.json();
      return data.data;
    },
  });
}
