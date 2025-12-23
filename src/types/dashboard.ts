/**
 * Type definitions for Dashboard API responses
 * Used by the Business Dashboard page
 */

export interface DashboardOverview {
  totalClients: number;
  totalOrders: number;
  clientGrowth: string;
  pendingOrders: number;
  inProgressOrders: number;
  readyForFittingOrders: number;
  completedOrdersThisMonth: number;
  unreadNotifications: number;
}

export interface DashboardRevenue {
  thisMonth: number;
  revenueTarget: number;
  revenueGrowth: string;
  averageOrderValue: number;
}

export interface RevenueTrendItem {
  month: string;
  revenue: number;
}

export interface GarmentDistributionItem {
  type: string;
  count: number;
}

export interface RecentOrder {
  id: string;
  orderNumber: string;
  clientName: string;
  garmentType: string;
  totalAmount: number;
  status: string;
}

export interface DashboardAppointment {
  id: string;
  type: string;
  clientName: string;
  startTime: string;
  endTime: string;
  status: string;
}

export interface DashboardStats {
  overview: DashboardOverview;
  revenue: DashboardRevenue;
  revenueTrend: RevenueTrendItem[];
  garmentDistribution: GarmentDistributionItem[];
  recentOrders: RecentOrder[];
  appointments: DashboardAppointment[];
}

// MetricCard props
export interface MetricCardProps {
  title: string;
  value: string | number;
  subtext: string;
  icon: React.ReactNode;
  color: 'gold' | 'green' | 'red' | 'black';
  trend?: string;
}

// Color map for MetricCard
export const METRIC_COLOR_MAP: Record<MetricCardProps['color'], string> = {
  gold: 'border-l-[var(--color-ghana-gold)]',
  green: 'border-l-[var(--color-ghana-green)]',
  red: 'border-l-[var(--color-ghana-red)]',
  black: 'border-l-black',
};
