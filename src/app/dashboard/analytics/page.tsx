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

async function getLeads() {
  const res = await fetch('/api/analytics/leads');
  if (!res.ok) throw new Error('Failed to fetch leads');
  const data = await res.json();
  return data.data;
}

async function getInventoryStats() {
  const res = await fetch('/api/analytics/inventory');
  if (!res.ok) throw new Error('Failed to fetch inventory stats');
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

  const { data: leads, isLoading: isLoadingLeads } = useQuery({
    queryKey: ['analytics-leads'],
    queryFn: getLeads,
  });

  const { data: inventoryStats, isLoading: isLoadingInv } = useQuery({
    queryKey: ['analytics-inventory'],
    queryFn: getInventoryStats,
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

        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <ReactECharts option={piePaymentOption} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Inventory Usage</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingInv ? (
              <Loader2 className="h-6 w-6 animate-spin mx-auto my-12" />
            ) : !inventoryStats?.topUsed || inventoryStats.topUsed.length === 0 ? (
              <p className="text-center py-12 text-muted-foreground text-sm">No usage data.</p>
            ) : (
              <div className="space-y-4 pt-2">
                {inventoryStats.topUsed.map((item: any, i: number) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold">{item.name}</span>
                      <span className="font-mono">{Number(item.total)} {item.unit}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${Math.min(100, (item.total / (inventoryStats.topUsed[0].total || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Recent Leads</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingLeads ? (
              <Loader2 className="h-6 w-6 animate-spin mx-auto my-12" />
            ) : !leads || leads.length === 0 ? (
              <p className="text-center py-12 text-muted-foreground text-sm">No active leads found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {leads.slice(0, 6).map((lead: any) => (
                  <div key={lead.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                    <div>
                      <p className="font-bold text-sm">{lead.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{lead.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-ghana-gold">
                        {lead._count?.appointments || 0} Appts
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>


    </div>
  );
}
