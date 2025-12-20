'use client';

import { motion } from 'framer-motion';
import {
    ArrowUpRight,
    CreditCard,
    Package,
    TrendingUp,
    Users,
    Activity,
    Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';

const STATS = [
    { label: 'Total Revenue', value: 'GH₵ 42,350', change: '+12.5%', icon: CreditCard, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Active Tailors', value: '1,284', change: '+4.2%', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Total Orders', value: '5,630', change: '+18.1%', icon: Package, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Platform Health', value: '99.9%', change: 'Optimal', icon: Zap, color: 'text-primary', bg: 'bg-primary/10' },
];

export default function AdminDashboardPage() {
    return (
        <div className="space-y-10">
            <div className="flex flex-col space-y-2">
                <h1 className="text-4xl font-black font-heading text-slate-900 tracking-tight">System <span className="text-primary">Overview</span></h1>
                <p className="text-slate-500 font-medium">Real-time platform performance and business health metrics.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {STATS.map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                        >
                            <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-3xl overflow-hidden">
                                <CardContent className="p-6 flex items-center gap-5">
                                    <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shrink-0", stat.bg)}>
                                        <Icon className={cn("h-7 w-7", stat.color)} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl font-black text-slate-900">{stat.value}</span>
                                            <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                                                stat.change.startsWith('+') ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"
                                            )}>
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
                <Card className="lg:col-span-2 border-none shadow-sm rounded-3xl p-8">
                    <CardHeader className="p-0 mb-8 border-b border-slate-50 pb-6 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-xl font-bold font-heading flex items-center gap-2">
                            <Activity className="h-5 w-5 text-primary" />
                            Recent Activity
                        </CardTitle>
                        <Badge variant="outline" className="rounded-full px-4 h-7 text-xs border-slate-200">View All Logs</Badge>
                    </CardHeader>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-slate-50 hover:bg-transparent">
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Action</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">User</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</TableHead>
                                <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Time</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[1, 2, 3, 4, 5].map((_, i) => (
                                <TableRow key={i} className="border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer group">
                                    <TableCell className="py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                                <TrendingUp className="h-4 w-4 text-slate-500" />
                                            </div>
                                            <span className="font-bold text-slate-900 text-sm">New Order Created</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium text-slate-500 text-sm">Kwame Mensah</TableCell>
                                    <TableCell>
                                        <Badge className="bg-emerald-50 text-emerald-600 border-none text-[10px] font-black uppercase">Success</Badge>
                                    </TableCell>
                                    <TableCell className="text-right text-xs font-bold text-slate-400">4m ago</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>

                <Card className="border-none shadow-sm rounded-3xl p-8 bg-slate-900 text-white relative overflow-hidden">
                    <div className="relative z-10 space-y-8">
                        <div className="space-y-2">
                            <p className="text-primary font-black uppercase tracking-[0.2em] text-[10px]">Platform Capacity</p>
                            <h3 className="text-3xl font-black font-heading leading-tight italic">Optimizing for Scale</h3>
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

// Helper function mock to avoid imports for now
function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
