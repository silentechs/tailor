/**
 * Reusable React Query hooks for common API patterns
 * Reduces code duplication across pages
 */

import { type UseQueryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/fetch-api';
import { captureError } from '@/lib/logger';
import type { DashboardStats } from '@/types/dashboard';

// Generic types
interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

interface SingleResponse<T> {
  success: boolean;
  data: T;
}

// ============================================
// Generic Fetch Functions
// ============================================

async function fetchData<T>(url: string): Promise<T> {
  const res = await fetchApi(url);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Failed to fetch data');
  }
  const data = await res.json();
  return data.data;
}

async function fetchPaginated<T>(url: string): Promise<PaginatedResponse<T>> {
  const res = await fetchApi(url);
  if (!res.ok) {
    throw new Error('Failed to fetch data');
  }
  return res.json();
}

// ============================================
// Dashboard Hooks
// ============================================

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: () => fetchData<DashboardStats>('/api/dashboard/stats'),
    staleTime: 30 * 1000, // 30 seconds
  });
}

// ============================================
// Orders Hooks
// ============================================

interface OrdersParams {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
}

export function useOrders(params: OrdersParams = {}) {
  const { page = 1, pageSize = 10, status, search } = params;
  const queryParams = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    ...(status && { status }),
    ...(search && { search }),
  });

  return useQuery({
    queryKey: ['orders', params],
    queryFn: () => fetchPaginated(`/api/orders?${queryParams}`),
  });
}

export function useOrder(orderId: string | null) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: () => fetchData(`/api/orders/${orderId}`),
    enabled: !!orderId,
  });
}

// ============================================
// Clients Hooks
// ============================================

interface ClientsParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export function useClients(params: ClientsParams = {}) {
  const { page = 1, pageSize = 10, search } = params;
  const queryParams = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    ...(search && { search }),
  });

  return useQuery({
    queryKey: ['clients', params],
    queryFn: () => fetchPaginated(`/api/clients?${queryParams}`),
  });
}

export function useClient(clientId: string | null) {
  return useQuery({
    queryKey: ['client', clientId],
    queryFn: () => fetchData(`/api/clients/${clientId}`),
    enabled: !!clientId,
  });
}

// ============================================
// Profile Hooks
// ============================================

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => fetchData('/api/user/profile'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetchApi('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update profile');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error) => {
      captureError('useUpdateProfile', error);
    },
  });
}

// ============================================
// Notifications Hooks
// ============================================

export function useNotifications(limit = 10) {
  return useQuery({
    queryKey: ['notifications', limit],
    queryFn: () => fetchData(`/api/notifications?limit=${limit}`),
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const res = await fetchApi(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to mark as read');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// ============================================
// Appointments Hooks
// ============================================

export function useAppointments(date?: string) {
  const queryParams = date ? `?date=${date}` : '';

  return useQuery({
    queryKey: ['appointments', date],
    queryFn: () => fetchData(`/api/appointments${queryParams}`),
  });
}

// ============================================
// Inventory Hooks
// ============================================

export function useInventory(params: { category?: string; search?: string } = {}) {
  const queryParams = new URLSearchParams();
  if (params.category) queryParams.set('category', params.category);
  if (params.search) queryParams.set('search', params.search);
  const query = queryParams.toString();

  return useQuery({
    queryKey: ['inventory', params],
    queryFn: () => fetchData(`/api/inventory${query ? `?${query}` : ''}`),
  });
}

// ============================================
// Portfolio Hooks
// ============================================

export function usePortfolio() {
  return useQuery({
    queryKey: ['portfolio'],
    queryFn: () => fetchData('/api/portfolio'),
  });
}

// ============================================
// Payments Hooks
// ============================================

export function usePayments(params: { page?: number; pageSize?: number } = {}) {
  const { page = 1, pageSize = 10 } = params;
  const queryParams = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });

  return useQuery({
    queryKey: ['payments', params],
    queryFn: () => fetchPaginated(`/api/payments?${queryParams}`),
  });
}

// ============================================
// Generic Delete Hook
// ============================================

export function useDelete(resourceType: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchApi(`/api/${resourceType}/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Delete failed');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [resourceType] });
    },
    onError: (error) => {
      captureError(`useDelete:${resourceType}`, error);
    },
  });
}
