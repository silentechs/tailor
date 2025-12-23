'use client';

import {
  BarChart3,
  PieChart,
  TrendingUp,
  MapPin,
  Users,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Download
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import ReactECharts from 'echarts-for-react';

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/analytics');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const revenueChartOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: data?.revenueTrend.map((t: any) => t.date) || [],
      axisLine: { show: false },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } },
      axisLine: { show: false }
    },
    series: [
      {
        data: data?.revenueTrend.map((t: any) => t.amount) || [],
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 4, color: '#0f172a' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(15, 23, 42, 0.1)' },
              { offset: 1, color: 'rgba(15, 23, 42, 0)' }
            ]
          }
        }
      }
    ]
  };

  const statusChartOption = {
    tooltip: { trigger: 'item' },
    legend: { bottom: '5%', left: 'center', icon: 'circle' },
    series: [
      {
        name: 'Order Status',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
        data: data?.statusDistribution || []
      }
    ]
  };

  const regionChartOption = {
    tooltip: { trigger: 'item' },
    series: [
      {
        name: 'Users by Region',
        type: 'pie',
        roseType: 'area',
        radius: [20, 100],
        center: ['50%', '50%'],
        itemStyle: { borderRadius: 8 },
        data: data?.regionalDistribution || []
      }
    ]
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-black font-heading text-slate-900 tracking-tight">
            Platform <span className="text-primary italic">Insights</span>
          </h1>
          <p className="text-slate-500 font-medium">
            Deep dive into platform growth, financials, and tailor performance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-12 rounded-2xl gap-2 font-bold text-slate-600 border-slate-200" onClick={fetchAnalytics}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Refresh Data
          </Button>
          <Button className="h-12 rounded-2xl gap-2 font-bold bg-slate-900 hover:bg-slate-800">
            <Download className="h-4 w-4" />
            Export Audit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Trend */}
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="p-8 pb-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                  Revenue Growth
                </CardTitle>
                <p className="text-sm font-medium text-slate-400">Total gross revenue across last 30 days</p>
              </div>
              <Badge className="bg-emerald-50 text-emerald-600 border-none font-black px-3 py-1">
                +12.5%
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-[300px]">
              <ReactECharts option={revenueChartOption} style={{ height: '100%' }} />
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="p-8 pb-0">
            <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Order Health
            </CardTitle>
            <p className="text-sm font-medium text-slate-400">Distribution of orders by their current status</p>
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-[300px]">
              <ReactECharts option={statusChartOption} style={{ height: '100%' }} />
            </div>
          </CardContent>
        </Card>

        {/* Region Distribution */}
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="p-8 pb-0">
            <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-500" />
              Geographic Presence
            </CardTitle>
            <p className="text-sm font-medium text-slate-400">User distribution across Ghanaian regions</p>
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-[300px]">
              <ReactECharts option={regionChartOption} style={{ height: '100%' }} />
            </div>
          </CardContent>
        </Card>

        {/* Tailor Performance */}
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-amber-500" />
              Top Workshops
            </CardTitle>
            <p className="text-sm font-medium text-slate-400">Highest grossing tailor accounts on the platform</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {data?.tailorPerformance.map((tailor: any, i: number) => (
                <div key={i} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center font-black text-white text-xs">
                      #{i + 1}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{tailor.name}</p>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{tailor.orderCount} Orders Completed</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-900">GH₵ {tailor.revenue.toLocaleString()}</p>
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Growth ⚡</p>
                  </div>
                </div>
              )) || (
                  <div className="p-20 text-center animate-pulse">
                    <p className="text-slate-300 font-black">Calculating Performance Data...</p>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
