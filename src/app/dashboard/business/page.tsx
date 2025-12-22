'use client';

import { useQuery } from '@tanstack/react-query';
import {
  ArrowUpRight,
  ChevronRight,
  Clock,
  CreditCard,
  Loader2,
  Scissors,
  ShoppingBag,
  TrendingUp,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { DashboardAppointments } from '@/components/dashboard/dashboard-appointments';
import { DashboardCharts } from '@/components/dashboard/dashboard-charts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn, formatCurrency } from '@/lib/utils';
import type {
  DashboardStats,
  METRIC_COLOR_MAP,
  MetricCardProps,
  RecentOrder,
} from '@/types/dashboard';

async function getDashboardStats(): Promise<DashboardStats> {
  const res = await fetch('/api/dashboard/stats');
  if (!res.ok) throw new Error('Failed to fetch dashboard stats');
  const data = await res.json();
  return data.data;
}

export default function BusinessDashboardPage() {
  const {
    data: stats,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
        <p className="text-sm text-muted-foreground font-medium animate-pulse">
          Analyzing your business data...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 bg-red-50/50 rounded-2xl border border-red-100">
        <p className="text-red-600 font-bold">Error loading dashboard stats.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 text-sm font-bold text-red-700 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold font-heading text-primary">Business Intelligence</h1>
          <p className="text-muted-foreground mt-1">
            Real-time performance and operational insights.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="bg-primary/5 border-primary/10 text-primary px-3 py-1 text-xs font-bold"
          >
            <Clock className="h-3 w-3 mr-2 text-primary" />
            Last updated {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Badge>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Monthly Revenue"
          value={formatCurrency(stats?.revenue?.thisMonth || 0)}
          subtext={`Target: ${formatCurrency(stats?.revenue?.revenueTarget || 5000)}`}
          icon={<CreditCard className="h-4 w-4" />}
          color="gold"
          trend={`${stats?.revenue?.revenueGrowth || '+0%'} vs last month`}
        />
        <MetricCard
          title="Active Orders"
          value={stats?.overview?.pendingOrders || 0}
          subtext={`${stats?.overview?.completedOrdersThisMonth || 0} completed this month`}
          icon={<Scissors className="h-4 w-4" />}
          color="green"
        />
        <MetricCard
          title="Total Clients"
          value={stats?.overview?.totalClients || 0}
          subtext={`${stats?.overview?.clientGrowth || '+0%'} growth`}
          icon={<Users className="h-4 w-4" />}
          color="red"
        />
        <MetricCard
          title="Avg. Order Value"
          value={formatCurrency(stats?.revenue?.averageOrderValue || 0)}
          subtext="Per completed project"
          icon={<TrendingUp className="h-4 w-4" />}
          color="black"
        />
      </div>

      {/* Visualizations */}
      <DashboardCharts
        revenueTrend={stats?.revenueTrend || []}
        garmentDistribution={stats?.garmentDistribution || []}
      />

      {/* Workshop Status Widget */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/dashboard/workshop">
          <Card className="hover:bg-primary/5 transition-colors group border-dashed">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold">To Start</CardTitle>
              <Scissors className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black">{stats?.overview?.pendingOrders || 0}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                View Queue <ChevronRight className="h-3 w-3" />
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/workshop">
          <Card className="hover:bg-primary/5 transition-colors group border-dashed">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold">On the Bench</CardTitle>
              <Clock className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black">{stats?.overview?.inProgressOrders || 0}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                View Queue <ChevronRight className="h-3 w-3" />
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/workshop">
          <Card className="hover:bg-primary/5 transition-colors group border-dashed">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold">Ready for Fitting</CardTitle>
              <Users className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black">
                {stats?.overview?.readyForFittingOrders || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                View Queue <ChevronRight className="h-3 w-3" />
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Activity */}
        <Card className="lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-0.5">
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest garment projects added</CardDescription>
            </div>
            <Link href="/dashboard/orders">
              <Button variant="ghost" size="sm" className="text-xs">
                View all <ArrowUpRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recentOrders && stats.recentOrders.length > 0 ? (
                stats.recentOrders.map((order: RecentOrder) => (
                  <div
                    key={order.id}
                    className="flex items-center gap-4 border-b border-slate-50 last:border-0 pb-3 last:pb-0 group hover:bg-slate-50/50 p-2 rounded-lg transition-colors"
                  >
                    <div className="h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10">
                      <ShoppingBag className="h-5 w-5 text-primary opacity-70" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between">
                        <p className="text-sm font-bold truncate">{order.clientName}</p>
                        <span className="text-xs font-mono font-bold text-slate-400">
                          {order.orderNumber}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate uppercase tracking-tighter">
                        {order.garmentType.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold font-mono text-sm">
                        {formatCurrency(order.totalAmount)}
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[9px] h-4 px-1 uppercase scale-90 origin-right"
                      >
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-muted-foreground flex flex-col items-center gap-2">
                  <ShoppingBag className="h-10 w-10 opacity-20" />
                  <p className="text-sm font-medium">No recent orders found.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <div className="lg:col-span-3 space-y-4">
          <DashboardAppointments appointments={stats?.appointments || []} />
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, subtext, icon, color, trend }: MetricCardProps) {
  const colorMap: Record<MetricCardProps['color'], string> = {
    gold: 'border-l-[var(--color-ghana-gold)]',
    green: 'border-l-[var(--color-ghana-green)]',
    red: 'border-l-[var(--color-ghana-red)]',
    black: 'border-l-black',
  };

  return (
    <Card
      className={cn(
        'border-l-4 overflow-hidden relative group hover:shadow-lg transition-all duration-300',
        colorMap[color]
      )}
    >
      <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-125 group-hover:opacity-[0.08] transition-all duration-500 pointer-events-none scale-110 origin-top-right">
        {icon}
      </div>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-black font-heading text-slate-900 dark:text-slate-100">
          {value}
        </div>
        {trend && (
          <div className="flex items-center gap-1 mt-1">
            <ArrowUpRight className="h-3 w-3 text-emerald-500" />
            <span className="text-[10px] font-bold text-emerald-600">{trend}</span>
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-2 font-medium">{subtext}</p>
      </CardContent>
    </Card>
  );
}
