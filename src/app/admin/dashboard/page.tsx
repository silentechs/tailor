'use client';

import { motion } from 'framer-motion';
import { Activity, ArrowUpRight, CreditCard, Package, TrendingUp, Users, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface DashboardStats {
  totalRevenue: number;
  activeTailors: number;
  totalOrders: number;
  platformHealth: number;
}

interface ActivityItem {
  id: string;
  type: string;
  label: string;
  user: string;
  status: string;
  time: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/dashboard/stats');
        const json = await res.json();
        if (json.success) {
          setStats(json.data.stats);
          setActivities(json.data.recentActivity);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      label: 'Total Revenue',
      value: `GH₵ ${(stats?.totalRevenue || 0).toLocaleString()}`,
      change: '+12.5%', // Hardcoded for now
      icon: CreditCard,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Active Tailors',
      value: (stats?.activeTailors || 0).toLocaleString(),
      change: '+4.2%',
      icon: Users,
      color: 'text-blue-500',
      bg: 'bg-blue-50',
    },
    {
      label: 'Total Orders',
      value: (stats?.totalOrders || 0).toLocaleString(),
      change: '+18.1%',
      icon: Package,
      color: 'text-amber-500',
      bg: 'bg-amber-50',
    },
    {
      label: 'Platform Health',
      value: `${stats?.platformHealth || 99.9}%`,
      change: 'Optimal',
      icon: Zap,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col space-y-2">
        <h1 className="text-2xl sm:text-4xl font-black font-heading text-slate-900 tracking-tight">
          System <span className="text-primary">Overview</span>
        </h1>
        <p className="text-slate-400 sm:text-slate-500 text-sm sm:text-base font-medium">
          Real-time platform performance and business health metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isLoading ? 0.5 : 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-3xl overflow-hidden">
                <CardContent className="p-6 flex items-center gap-5">
                  <div
                    className={cn(
                      'h-14 w-14 rounded-2xl flex items-center justify-center shrink-0',
                      stat.bg
                    )}
                  >
                    <Icon className={cn('h-7 w-7', stat.color)} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                      {stat.label}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900">
                        {isLoading ? '...' : stat.value}
                      </span>
                      <span
                        className={cn(
                          'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                          stat.change.startsWith('+')
                            ? 'bg-emerald-100 text-emerald-600'
                            : 'bg-slate-100 text-slate-500'
                        )}
                      >
                        {stat.change}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm rounded-3xl p-4 sm:p-8">
          <CardHeader className="p-0 mb-6 sm:mb-8 border-b border-slate-50 pb-6 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg sm:text-xl font-bold font-heading flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
            <Button variant="ghost" size="sm" className="rounded-full px-3 sm:px-4 text-[10px] sm:text-xs font-bold" asChild>
              <Link href="/admin/logs">View All Logs</Link>
            </Button>
          </CardHeader>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle px-4 sm:px-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-50 hover:bg-transparent">
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Action
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      User
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Status
                    </TableHead>
                    <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Time
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    [1, 2, 3].map((i) => (
                      <TableRow key={i} className="animate-pulse">
                        <TableCell colSpan={4} className="h-12 bg-slate-50/50 rounded-lg mb-2" />
                      </TableRow>
                    ))
                  ) : activities.length > 0 ? (
                    activities.map((activity) => (
                      <TableRow
                        key={activity.id}
                        className="border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer group"
                      >
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                              <TrendingUp className="h-4 w-4 text-slate-500" />
                            </div>
                            <span className="font-bold text-slate-900 text-sm">{activity.label}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-slate-500 text-sm truncate max-w-[150px]">
                          {activity.user}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={cn(
                              "border-none text-[10px] font-black uppercase",
                              activity.status === 'SUCCESS' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                            )}
                          >
                            {activity.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-xs font-bold text-slate-400">
                          {formatDistanceToNow(new Date(activity.time), { addSuffix: true })}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10 text-slate-400 font-medium">
                        No recent activity found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl p-6 sm:p-8 bg-slate-900 text-white relative overflow-hidden">
          <div className="relative z-10 space-y-8">
            <div className="space-y-2">
              <p className="text-primary font-black uppercase tracking-[0.2em] text-[10px]">
                Platform Capacity
              </p>
              <h3 className="text-3xl font-black font-heading leading-tight italic">
                Optimizing for Scale
              </h3>
            </div>
            <div className="space-y-6">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-slate-400">Server Utilization</span>
                <span className="font-black text-primary">24%</span>
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '24%' }}
                  className="h-full bg-primary"
                />
              </div>
              <p className="text-sm text-slate-400 leading-relaxed font-medium">
                System is currently under-utilized. Ready for mass onboarding of new workshops.
              </p>
            </div>
            <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 rounded-xl">
              Generate Report
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          {/* Background Decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 opacity-10 pointer-events-none transform translate-x-12 -translate-y-12">
            <div className="w-full h-full border-[20px] border-primary rounded-full" />
          </div>
        </Card>
      </div>
    </div>
  );
}

import Link from 'next/link';
