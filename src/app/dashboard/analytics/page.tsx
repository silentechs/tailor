'use client';

import { useQuery } from '@tanstack/react-query';
import ReactECharts from 'echarts-for-react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

async function getStats() {
  const res = await fetch('/api/dashboard/stats');
  if (!res.ok) throw new Error('Failed to fetch stats');
  const data = await res.json();
  return data.data;
}

export default function AnalyticsPage() {
  const {
    data: stats,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getStats,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Error loading analytics.</div>;
  }

  const revenueData = [
    { name: 'Today', value: stats?.revenue?.today || 0 },
    { name: 'This Week', value: stats?.revenue?.thisWeek || 0 },
    { name: 'This Month', value: stats?.revenue?.thisMonth || 0 },
  ];

  const orderStatusData =
    stats?.ordersByStatus?.map((item: any) => ({
      name: item.status.replace(/_/g, ' '),
      value: item.count,
    })) || [];

  const paymentMethodData =
    stats?.paymentsByMethod?.map((item: any) => ({
      name: item.method.replace(/_/g, ' '),
      value: item.amount,
    })) || [];

  const barOption = {
    title: { text: 'Revenue Overview', left: 'center' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: revenueData.map((d) => d.name) },
    yAxis: { type: 'value' },
    series: [{ data: revenueData.map((d) => d.value), type: 'bar', color: '#006B3F' }], // Ghana Green
  };

  const pieOption = {
    title: { text: 'Orders by Status', left: 'center' },
    tooltip: { trigger: 'item' },
    series: [
      {
        type: 'pie',
        radius: '50%',
        data: orderStatusData,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  };

  const piePaymentOption = {
    title: { text: 'Revenue by Payment Method', left: 'center' },
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => `${params.name}: ${formatCurrency(params.value)}`,
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        data: paymentMethodData,
        color: ['#FCD116', '#CE1126', '#006B3F', '#000000'], // Ghana Colors
      },
    ],
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-heading text-primary">Analytics</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ReactECharts option={barOption} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ReactECharts option={pieOption} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <ReactECharts option={piePaymentOption} style={{ height: '400px' }} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
