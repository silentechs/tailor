'use client';

import { useQuery } from '@tanstack/react-query';
import ReactECharts from 'echarts-for-react';
import {
  TrendingUp,
  Users,
  ShoppingBag,
  CreditCard,
  ArrowUpRight,
  Loader2,
  Calendar,
  Box,
  UserPlus
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatCurrency, cn } from '@/lib/utils';
import { motion } from 'framer-motion';

async function getAnalytics() {
  const res = await fetch('/api/dashboard/analytics');
  if (!res.ok) throw new Error('Failed to fetch analytics');
  const data = await res.json();
  return data.data;
}

export default function AnalyticsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics'],
    queryFn: getAnalytics,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">Generating Intelligence...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-center text-red-500 font-bold">Failed to load analytics data.</div>;
  }

  const { revenueTrend, garmentData, topClients, methodData, leads, inventoryUsage } = data;

  // 1. Revenue Chart Option
  const revenueOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#fff',
      borderColor: '#f1f5f9',
      borderWidth: 1,
      textStyle: { color: '#0f172a' },
      formatter: (params: any) => `
        <div class="p-2">
          <div class="text-[10px] text-slate-400 font-black uppercase mb-1">${params[0].name}</div>
          <div class="text-sm font-black">${formatCurrency(params[0].value)}</div>
        </div>
      `
    },
    xAxis: {
      type: 'category',
      data: revenueTrend.map((d: any) => d.date),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold' }
    },
    yAxis: {
      type: 'value',
      show: false,
      splitLine: { show: false }
    },
    series: [
      {
        data: revenueTrend.map((d: any) => d.amount),
        type: 'line',
        smooth: true,
        showSymbol: false,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(212, 175, 55, 0.4)' },
              { offset: 1, color: 'rgba(212, 175, 55, 0)' }
            ]
          }
        },
        lineStyle: { color: '#D4AF37', width: 4 },
      }
    ],
    grid: { left: '0', right: '0', bottom: '20', top: '20', containLabel: false },
  };

  // 2. Garment Pie Chart Option
  const garmentOption = {
    tooltip: { trigger: 'item' },
    series: [
      {
        name: 'Types',
        type: 'pie',
        radius: ['60%', '85%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 4,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: { show: false },
        data: garmentData,
        color: ['#1A1A1A', '#D4AF37', '#7C7C7C', '#333333', '#B8860B', '#E5E7EB']
      }
    ]
  };

  return (
    <div className="space-y-8 p-6 lg:p-10 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 rounded-full px-3 py-1 font-black text-[10px] uppercase tracking-widest">
            Enterprise Intelligence
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-black font-heading uppercase italic tracking-tighter leading-none">
            Business <br /> <span className="text-primary italic">Analytics</span>
          </h1>
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest bg-white px-4 py-2 rounded-2xl shadow-sm">
          <Calendar className="h-4 w-4" />
          Last 30 Days: {revenueTrend[0].date} — {revenueTrend[revenueTrend.length - 1].date}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Revenue Chart */}
        <Card className="lg:col-span-2 rounded-[2.5rem] border-none shadow-2xl shadow-slate-200/60 bg-white overflow-hidden">
          <CardHeader className="p-8 pb-0">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Revenue Growth</CardTitle>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black font-heading italic">
                    {formatCurrency(revenueTrend.reduce((sum: number, d: any) => sum + d.amount, 0))}
                  </span>
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-none rounded-lg text-[10px] font-black">
                    +14.2%
                  </Badge>
                </div>
              </div>
              <div className="h-12 w-12 bg-ghana-gold/10 rounded-2xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-ghana-gold" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[350px] w-full mt-4">
              <ReactECharts option={revenueOption} style={{ height: '100%', width: '100%' }} />
            </div>
          </CardContent>
        </Card>

        {/* Garment Dist */}
        <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-slate-200/60 bg-white p-8">
          <CardHeader className="p-0 mb-8">
            <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Garment Mix</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex flex-col items-center">
            <div className="h-[220px] w-full relative">
              <ReactECharts option={garmentOption} style={{ height: '100%', width: '100%' }} />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-black font-heading italic leading-none">{garmentData.length}</span>
                <span className="text-[10px] font-black uppercase text-slate-300">STYLES</span>
              </div>
            </div>
            <div className="w-full mt-8 space-y-3">
              {garmentData.slice(0, 4).map((d: any, i: number) => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: garmentOption.series[0].color[i] }} />
                    <span className="font-bold text-slate-600 truncate max-w-[120px] uppercase tracking-tighter">{d.name}</span>
                  </div>
                  <span className="font-black font-heading italic">{d.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Top Clients */}
        <Card className="lg:col-span-2 rounded-[2.5rem] border-none shadow-2xl shadow-slate-200/60 bg-white p-8">
          <CardHeader className="p-0 mb-6 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Premium Client List</CardTitle>
            <Users className="h-5 w-5 text-slate-300" />
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[10px] font-black text-slate-300 uppercase tracking-widest border-b border-slate-50">
                  <th className="text-left pb-4 font-black">Rank</th>
                  <th className="text-left pb-4 font-black">Client Name</th>
                  <th className="text-center pb-4 font-black">Orders</th>
                  <th className="text-right pb-4 font-black">LTV Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {topClients.map((client: any, idx: number) => (
                  <tr key={client.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 font-heading italic font-black text-slate-400">#{idx + 1}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary">
                          {client.name.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-900">{client.name}</span>
                      </div>
                    </td>
                    <td className="py-4 text-center font-bold text-slate-500">{client.orderCount}</td>
                    <td className="py-4 text-right">
                      <span className="font-black text-slate-900">{formatCurrency(client.totalRevenue)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Inventory Use */}
        <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-slate-200/60 bg-primary text-white p-8">
          <CardHeader className="p-0 mb-8 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-black uppercase tracking-[0.2em] opacity-60">Supply Consumption</CardTitle>
              <p className="text-[10px] font-bold uppercase opacity-40 mt-1">Top Materials Depleted</p>
            </div>
            <Box className="h-6 w-6 opacity-30" />
          </CardHeader>
          <CardContent className="p-0 space-y-6">
            {inventoryUsage.length > 0 ? inventoryUsage.map((item: any) => (
              <div key={item.name} className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-tighter">
                  <span className="opacity-80">{item.name}</span>
                  <span className="font-black italic font-heading">{item.total} {item.unit}</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (item.total / (inventoryUsage[0].total || 1)) * 100)}%` }}
                    className="h-full bg-white"
                  />
                </div>
              </div>
            )) : (
              <div className="py-12 text-center opacity-40 text-xs font-bold uppercase">No movement recorded</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Recent Leads */}
        <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-slate-200/60 bg-white p-8 lg:col-span-1">
          <CardHeader className="p-0 mb-6 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Recent Leads</CardTitle>
            <UserPlus className="h-5 w-5 text-slate-300" />
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            {leads.map((lead: any) => (
              <div key={lead.id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-ghana-gold rounded-full" />
                  <div>
                    <p className="text-sm font-black tracking-tight">{lead.name}</p>
                    <p className="text-[10px] font-bold text-slate-400">{lead.phone}</p>
                  </div>
                </div>
                <Badge className="bg-white text-slate-900 border border-slate-200 rounded-lg text-[10px] font-black">
                  {lead._count.appointments} APPT
                </Badge>
              </div>
            ))}
            {leads.length === 0 && <p className="text-center py-8 text-xs font-bold text-slate-300 uppercase">No new leads</p>}
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {methodData.map((method: any) => (
            <Card key={method.name} className="rounded-3xl border-none shadow-xl bg-white p-6 relative overflow-hidden group hover:bg-ghana-black hover:text-white transition-all duration-300">
              <div className="z-10 relative">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-slate-500 mb-4">{method.name}</p>
                <p className="text-3xl font-black font-heading italic tracking-tighter mb-2">{formatCurrency(method.value)}</p>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-3 w-3 opacity-30" />
                  <span className="text-[10px] font-bold uppercase opacity-40">{method.count} Transactions</span>
                </div>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity">
                <CreditCard className="h-24 w-24" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
