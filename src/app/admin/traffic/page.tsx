'use client';

import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import {
    Activity,
    BarChart3,
    Eye,
    Globe,
    Monitor,
    MousePointerClick,
    RefreshCcw,
    Smartphone,
    Tablet,
    TrendingUp,
    Users,
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { countryCodeToEmoji } from '@/lib/geolocation';

interface TrafficData {
    summary: {
        totalPageViews: number;
        totalClicks: number;
        uniqueVisitors: number;
        avgPagesPerVisitor: number;
    };
    pageViewsByDay: Array<{ date: string; count: number }>;
    topPages: Array<{ path: string; views: number }>;
    topCountries: Array<{ country: string; countryCode: string; visits: number }>;
    deviceBreakdown: Array<{ name: string; value: number }>;
    browserBreakdown: Array<{ name: string; value: number }>;
    recentEvents: Array<{
        id: string;
        eventType: string;
        eventName: string | null;
        path: string;
        country: string | null;
        countryCode: string | null;
        deviceType: string | null;
        createdAt: string;
    }>;
}

export default function TrafficPage() {
    const { data, isLoading, refetch, isFetching } = useQuery({
        queryKey: ['admin-traffic'],
        queryFn: async () => {
            const res = await fetch('/api/admin/traffic');
            if (!res.ok) throw new Error('Failed to fetch traffic data');
            return res.json();
        },
        refetchInterval: 30000, // Refresh every 30 seconds
    });

    const traffic: TrafficData | null = data?.data || null;

    // Chart options
    const pageViewsChartOption = {
        tooltip: { trigger: 'axis' },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
            type: 'category',
            data: traffic?.pageViewsByDay.map(d => d.date.slice(5)) || [],
            axisLine: { show: false },
            axisTick: { show: false },
        },
        yAxis: {
            type: 'value',
            splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } },
            axisLine: { show: false },
        },
        series: [
            {
                data: traffic?.pageViewsByDay.map(d => d.count) || [],
                type: 'bar',
                barWidth: '60%',
                itemStyle: {
                    borderRadius: [4, 4, 0, 0],
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: '#006B3F' },
                            { offset: 1, color: '#00A35C' },
                        ],
                    },
                },
            },
        ],
    };

    const deviceChartOption = {
        tooltip: { trigger: 'item' },
        legend: { bottom: '5%', left: 'center', icon: 'circle' },
        series: [
            {
                name: 'Devices',
                type: 'pie',
                radius: ['45%', '70%'],
                avoidLabelOverlap: false,
                itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
                label: { show: false },
                emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
                data: traffic?.deviceBreakdown.map(d => ({
                    name: d.name.charAt(0).toUpperCase() + d.name.slice(1),
                    value: d.value,
                    itemStyle: {
                        color: d.name === 'mobile' ? '#006B3F' : d.name === 'desktop' ? '#0f172a' : '#64748b',
                    },
                })) || [],
            },
        ],
    };

    const getDeviceIcon = (type: string) => {
        switch (type?.toLowerCase()) {
            case 'mobile': return <Smartphone className="h-3 w-3" />;
            case 'tablet': return <Tablet className="h-3 w-3" />;
            default: return <Monitor className="h-3 w-3" />;
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black font-heading text-slate-900 tracking-tight">
                        Traffic <span className="text-primary italic">Analytics</span>
                    </h1>
                    <p className="text-slate-500 font-medium">
                        Real-time visitor tracking and engagement metrics.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Badge variant="outline" className="h-10 px-4 font-bold text-slate-500 border-slate-200">
                        <Activity className="h-3 w-3 mr-2 text-emerald-500 animate-pulse" />
                        Live
                    </Badge>
                    <Button
                        variant="outline"
                        className="h-10 rounded-xl gap-2 font-bold text-slate-600 border-slate-200"
                        onClick={() => refetch()}
                        disabled={isFetching}
                    >
                        <RefreshCcw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    label="Page Views"
                    value={traffic?.summary.totalPageViews || 0}
                    icon={<Eye className="h-5 w-5" />}
                    color="bg-primary"
                    loading={isLoading}
                />
                <StatCard
                    label="Unique Visitors"
                    value={traffic?.summary.uniqueVisitors || 0}
                    icon={<Users className="h-5 w-5" />}
                    color="bg-slate-900"
                    loading={isLoading}
                />
                <StatCard
                    label="Click Events"
                    value={traffic?.summary.totalClicks || 0}
                    icon={<MousePointerClick className="h-5 w-5" />}
                    color="bg-blue-500"
                    loading={isLoading}
                />
                <StatCard
                    label="Pages/Visitor"
                    value={traffic?.summary.avgPagesPerVisitor || 0}
                    icon={<TrendingUp className="h-5 w-5" />}
                    color="bg-amber-500"
                    loading={isLoading}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Page Views Chart */}
                <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="p-6 pb-2">
                        <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-primary" />
                            Daily Page Views
                        </CardTitle>
                        <p className="text-sm font-medium text-slate-400">Last 30 days</p>
                    </CardHeader>
                    <CardContent className="p-6 pt-2">
                        <div className="h-[280px]">
                            {isLoading ? (
                                <div className="h-full flex items-center justify-center text-slate-300">
                                    <RefreshCcw className="h-6 w-6 animate-spin" />
                                </div>
                            ) : (
                                <ReactECharts option={pageViewsChartOption} style={{ height: '100%' }} />
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Device Breakdown */}
                <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="p-6 pb-2">
                        <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <Monitor className="h-5 w-5 text-slate-600" />
                            Device Breakdown
                        </CardTitle>
                        <p className="text-sm font-medium text-slate-400">Visits by device type</p>
                    </CardHeader>
                    <CardContent className="p-6 pt-2">
                        <div className="h-[280px]">
                            {isLoading ? (
                                <div className="h-full flex items-center justify-center text-slate-300">
                                    <RefreshCcw className="h-6 w-6 animate-spin" />
                                </div>
                            ) : (
                                <ReactECharts option={deviceChartOption} style={{ height: '100%' }} />
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Top Pages */}
                <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="p-6 pb-2">
                        <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <Eye className="h-5 w-5 text-primary" />
                            Top Pages
                        </CardTitle>
                        <p className="text-sm font-medium text-slate-400">Most visited pages</p>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-50">
                            {isLoading ? (
                                <div className="p-10 text-center text-slate-300">
                                    <RefreshCcw className="h-5 w-5 animate-spin mx-auto" />
                                </div>
                            ) : traffic?.topPages.length === 0 ? (
                                <div className="p-10 text-center text-slate-400 text-sm">
                                    No page views yet. Start browsing to generate data.
                                </div>
                            ) : (
                                traffic?.topPages.slice(0, 8).map((page, i) => (
                                    <div key={page.path} className="px-6 py-3 flex items-center justify-between hover:bg-slate-50/50">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-black text-slate-300 w-5">{i + 1}</span>
                                            <span className="text-sm font-bold text-slate-700 truncate max-w-[200px]">
                                                {page.path}
                                            </span>
                                        </div>
                                        <Badge variant="secondary" className="font-bold text-slate-500 bg-slate-100">
                                            {page.views.toLocaleString()}
                                        </Badge>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Top Countries */}
                <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="p-6 pb-2">
                        <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <Globe className="h-5 w-5 text-blue-500" />
                            Top Countries
                        </CardTitle>
                        <p className="text-sm font-medium text-slate-400">Visitors by location</p>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-50">
                            {isLoading ? (
                                <div className="p-10 text-center text-slate-300">
                                    <RefreshCcw className="h-5 w-5 animate-spin mx-auto" />
                                </div>
                            ) : traffic?.topCountries.length === 0 ? (
                                <div className="p-10 text-center text-slate-400 text-sm">
                                    No country data yet. Visits will be geolocated automatically.
                                </div>
                            ) : (
                                traffic?.topCountries.slice(0, 8).map((country) => (
                                    <div key={country.country} className="px-6 py-3 flex items-center justify-between hover:bg-slate-50/50">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">{countryCodeToEmoji(country.countryCode)}</span>
                                            <span className="text-sm font-bold text-slate-700">{country.country}</span>
                                        </div>
                                        <Badge variant="secondary" className="font-bold text-slate-500 bg-slate-100">
                                            {country.visits.toLocaleString()}
                                        </Badge>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Live Activity Feed */}
            <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="p-6 pb-2">
                    <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <Activity className="h-5 w-5 text-emerald-500" />
                        Recent Activity
                        <span className="ml-2 h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                    </CardTitle>
                    <p className="text-sm font-medium text-slate-400">Live event stream</p>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
                        {isLoading ? (
                            <div className="p-10 text-center text-slate-300">
                                <RefreshCcw className="h-5 w-5 animate-spin mx-auto" />
                            </div>
                        ) : traffic?.recentEvents.length === 0 ? (
                            <div className="p-10 text-center text-slate-400 text-sm">
                                No events yet. Navigate around the app to generate activity.
                            </div>
                        ) : (
                            traffic?.recentEvents.map((event) => (
                                <div key={event.id} className="px-6 py-3 flex items-center justify-between hover:bg-slate-50/50">
                                    <div className="flex items-center gap-4">
                                        {event.countryCode && (
                                            <span className="text-lg">{countryCodeToEmoji(event.countryCode)}</span>
                                        )}
                                        {!event.countryCode && <Globe className="h-4 w-4 text-slate-300" />}
                                        <div className="flex items-center gap-2">
                                            {getDeviceIcon(event.deviceType || '')}
                                            <Badge
                                                className={cn(
                                                    'text-[9px] font-black uppercase border-none px-2 py-0.5',
                                                    event.eventType === 'page_view'
                                                        ? 'bg-blue-50 text-blue-600'
                                                        : event.eventType === 'click'
                                                            ? 'bg-amber-50 text-amber-600'
                                                            : 'bg-slate-100 text-slate-500'
                                                )}
                                            >
                                                {event.eventType.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                        <span className="text-sm font-medium text-slate-600 truncate max-w-[300px]">
                                            {event.eventName || event.path}
                                        </span>
                                    </div>
                                    <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                                        {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function StatCard({
    label,
    value,
    icon,
    color,
    loading,
}: {
    label: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    loading?: boolean;
}) {
    return (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                        {label}
                    </p>
                    {loading ? (
                        <div className="h-8 w-16 bg-slate-100 rounded animate-pulse" />
                    ) : (
                        <p className="text-2xl font-black text-slate-900">{value.toLocaleString()}</p>
                    )}
                </div>
                <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center text-white', color)}>
                    {icon}
                </div>
            </div>
        </div>
    );
}
