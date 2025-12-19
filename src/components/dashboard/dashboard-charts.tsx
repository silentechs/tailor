'use client';

import ReactECharts from 'echarts-for-react';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardChartsProps {
  revenueTrend: Array<{ month: string; revenue: number }>;
  garmentDistribution: Array<{ type: string; count: number }>;
}

export function DashboardCharts({ revenueTrend, garmentDistribution }: DashboardChartsProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const revenueOptions = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}: GHS {c}',
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderColor: isDark ? '#334155' : '#e2e8f0',
      textStyle: { color: isDark ? '#f8fafc' : '#0f172a' },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: revenueTrend.map((d) => d.month),
      axisLine: { lineStyle: { color: isDark ? '#334155' : '#e2e8f0' } },
      axisLabel: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: isDark ? '#1e293b' : '#f1f5f9' } },
      axisLabel: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 10 },
    },
    series: [
      {
        data: revenueTrend.map((d) => d.revenue),
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        itemStyle: { color: '#006B3F' }, // Ghana Green
        lineStyle: { width: 3, color: '#006B3F' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(0, 107, 63, 0.2)' },
              { offset: 1, color: 'rgba(0, 107, 63, 0)' },
            ],
          },
        },
      },
    ],
  };

  const garmentOptions = {
    tooltip: {
      trigger: 'item',
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderColor: isDark ? '#334155' : '#e2e8f0',
      textStyle: { color: isDark ? '#f8fafc' : '#0f172a' },
    },
    series: [
      {
        name: 'Garments',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: isDark ? '#020617' : '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 12,
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: false,
        },
        data: garmentDistribution.map((d) => ({
          value: d.count,
          name: d.type.replace(/_/g, ' '),
        })),
        color: ['#006B3F', '#FCD116', '#CE1126', '#000000', '#94a3b8'], // Ghana Flag + Neutral
      },
    ],
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <Card className="lg:col-span-4">
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <CardDescription>Monthly earnings over the last 6 months</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ReactECharts
            option={revenueOptions}
            style={{ height: '100%', width: '100%' }}
            theme={isDark ? 'dark' : undefined}
          />
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Garment Distribution</CardTitle>
          <CardDescription>Most popular styles in your workshop</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ReactECharts
            option={garmentOptions}
            style={{ height: '100%', width: '100%' }}
            theme={isDark ? 'dark' : undefined}
          />
        </CardContent>
      </Card>
    </div>
  );
}
