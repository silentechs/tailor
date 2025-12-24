'use client';

import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Globe, MapPin, Monitor, RefreshCcw, Search, Filter, X } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { countryCodeToEmoji, parseUserAgent } from '@/lib/geolocation';

interface LoginSession {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    userRole: string;
    userImage: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    country: string | null;
    city: string | null;
    region: string | null;
    countryCode: string | null;
    createdAt: string;
    expiresAt: string;
}

const PAGE_SIZE = 15;

export default function LoginHistoryPage() {
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(0);
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [countryFilter, setCountryFilter] = useState<string>('all');

    // Debounce search input
    const handleSearchChange = (value: string) => {
        setSearch(value);
        setPage(0);
        // Simple debounce
        setTimeout(() => setDebouncedSearch(value), 300);
    };

    const { data, isLoading, refetch, isFetching } = useQuery({
        queryKey: ['admin-login-history', debouncedSearch, page],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (debouncedSearch) params.append('search', debouncedSearch);
            params.append('limit', String(PAGE_SIZE));
            params.append('offset', String(page * PAGE_SIZE));
            const res = await fetch(`/api/admin/login-history?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch login history');
            return res.json();
        },
    });

    const allSessions: LoginSession[] = data?.data || [];
    const pagination = data?.pagination || { total: 0, limit: PAGE_SIZE, offset: 0, hasMore: false };

    // Get unique countries for filter dropdown
    const uniqueCountries = useMemo(() => {
        const countries = new Set(allSessions.map(s => s.country).filter(Boolean));
        return Array.from(countries).sort();
    }, [allSessions]);

    // Apply client-side filters
    const sessions = useMemo(() => {
        return allSessions.filter(session => {
            // Role filter
            if (roleFilter !== 'all' && session.userRole !== roleFilter) return false;

            // Status filter
            const isActive = new Date(session.expiresAt) > new Date();
            if (statusFilter === 'active' && !isActive) return false;
            if (statusFilter === 'expired' && isActive) return false;

            // Country filter
            if (countryFilter !== 'all' && session.country !== countryFilter) return false;

            return true;
        });
    }, [allSessions, roleFilter, statusFilter, countryFilter]);

    const totalPages = Math.ceil(pagination.total / PAGE_SIZE);
    const hasActiveFilters = roleFilter !== 'all' || statusFilter !== 'all' || countryFilter !== 'all';

    const clearFilters = () => {
        setRoleFilter('all');
        setStatusFilter('all');
        setCountryFilter('all');
    };

    const getRoleBadgeStyle = (role: string) => {
        switch (role) {
            case 'ADMIN':
                return 'bg-purple-50 text-purple-600';
            case 'TAILOR':
            case 'SEAMSTRESS':
                return 'bg-blue-50 text-blue-600';
            case 'CLIENT':
                return 'bg-emerald-50 text-emerald-600';
            default:
                return 'bg-slate-50 text-slate-600';
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black font-heading text-slate-900 tracking-tight">
                        Login <span className="text-primary italic">History</span>
                    </h1>
                    <p className="text-slate-500 font-medium">
                        Track who logged in, when, and from where around the world.
                    </p>
                </div>
                <div className="flex gap-3">
                    <div className="relative group w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Search by name or email..."
                            className="pl-12 h-12 bg-white shadow-sm border-slate-100 focus:border-primary/50 transition-all rounded-xl"
                            value={search}
                            onChange={(e) => handleSearchChange(e.target.value)}
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-12 w-12 rounded-xl border-slate-100"
                        onClick={() => refetch()}
                        disabled={isFetching}
                    >
                        <RefreshCcw className={cn('h-5 w-5', isFetching && 'animate-spin')} />
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    label="Total Logins"
                    value={pagination.total}
                    icon={<Globe className="h-5 w-5" />}
                    color="bg-slate-900"
                />
                <StatCard
                    label="Unique Countries"
                    value={uniqueCountries.length}
                    icon={<MapPin className="h-5 w-5" />}
                    color="bg-blue-500"
                />
                <StatCard
                    label="Active Sessions"
                    value={allSessions.filter(s => new Date(s.expiresAt) > new Date()).length}
                    icon={<Monitor className="h-5 w-5" />}
                    color="bg-emerald-500"
                />
                <StatCard
                    label="Today's Logins"
                    value={allSessions.filter(s => {
                        const loginDate = new Date(s.createdAt);
                        const today = new Date();
                        return loginDate.toDateString() === today.toDateString();
                    }).length}
                    icon={<RefreshCcw className="h-5 w-5" />}
                    color="bg-amber-500"
                />
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                    <Filter className="h-4 w-4" />
                    <span>Filters:</span>
                </div>

                {/* Role Filter */}
                <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(0); }}>
                    <SelectTrigger className="w-[140px] h-10 rounded-xl border-slate-200 bg-white">
                        <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="TAILOR">Tailor</SelectItem>
                        <SelectItem value="SEAMSTRESS">Seamstress</SelectItem>
                        <SelectItem value="CLIENT">Client</SelectItem>
                    </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
                    <SelectTrigger className="w-[140px] h-10 rounded-xl border-slate-200 bg-white">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                </Select>

                {/* Country Filter */}
                <Select value={countryFilter} onValueChange={(v) => { setCountryFilter(v); setPage(0); }}>
                    <SelectTrigger className="w-[160px] h-10 rounded-xl border-slate-200 bg-white">
                        <SelectValue placeholder="Country" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Countries</SelectItem>
                        {uniqueCountries.map(country => (
                            <SelectItem key={country} value={country!}>
                                {country}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Clear Filters */}
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="h-10 px-3 text-slate-500 hover:text-slate-900"
                    >
                        <X className="h-4 w-4 mr-1" />
                        Clear
                    </Button>
                )}

                {/* Results count */}
                <div className="ml-auto text-sm text-slate-400 font-medium">
                    Showing {sessions.length} of {pagination.total} sessions
                </div>
            </div>

            {/* Table */}
            <Card className="border-none shadow-sm rounded-2xl overflow-hidden p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="border-slate-50 hover:bg-transparent">
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-6 h-14">
                                User
                            </TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-14">
                                Location
                            </TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-14">
                                Device
                            </TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-14">
                                Login Time
                            </TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 pr-6 h-14">
                                Status
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <RefreshCcw className="h-4 w-4 animate-spin" />
                                        Loading...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : sessions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    No login history found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            sessions.map((session, idx) => (
                                <motion.tr
                                    key={session.id}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.02 }}
                                    className="border-slate-50 hover:bg-slate-50/50 transition-colors"
                                >
                                    <TableCell className="py-4 pl-6">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                                                {session.userImage ? (
                                                    <AvatarImage src={session.userImage} />
                                                ) : null}
                                                <AvatarFallback className="bg-slate-100 text-slate-400 font-bold text-xs">
                                                    {session.userName?.charAt(0) || '?'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <p className="font-bold text-slate-900 text-sm truncate max-w-[150px]">
                                                    {session.userName}
                                                </p>
                                                <p className="text-xs text-slate-400 font-medium truncate max-w-[150px]">{session.userEmail}</p>
                                            </div>
                                            <Badge
                                                className={cn(
                                                    'text-[9px] font-black uppercase shadow-sm border-none px-2 py-0.5 shrink-0',
                                                    getRoleBadgeStyle(session.userRole)
                                                )}
                                            >
                                                {session.userRole}
                                            </Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {session.country ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">
                                                    {countryCodeToEmoji(session.countryCode)}
                                                </span>
                                                <div>
                                                    <p className="font-bold text-slate-700 text-sm">
                                                        {session.city || session.region || 'Unknown'}
                                                    </p>
                                                    <p className="text-xs text-slate-400 font-medium">
                                                        {session.country}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <Globe className="h-4 w-4" />
                                                <span className="text-sm font-medium">
                                                    {session.ipAddress || 'Unknown'}
                                                </span>
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <p className="text-sm font-medium text-slate-600">
                                            {parseUserAgent(session.userAgent)}
                                        </p>
                                        <p className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-[150px]" title={session.ipAddress || undefined}>
                                            IP: {session.ipAddress || 'N/A'}
                                        </p>
                                    </TableCell>
                                    <TableCell>
                                        <p className="text-sm font-bold text-slate-700">
                                            {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                                        </p>
                                        <p className="text-xs text-slate-400 font-medium">
                                            {new Date(session.createdAt).toLocaleString()}
                                        </p>
                                    </TableCell>
                                    <TableCell className="pr-6">
                                        {new Date(session.expiresAt) > new Date() ? (
                                            <Badge className="bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase shadow-sm border-none">
                                                Active
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-slate-100 text-slate-500 text-[10px] font-black uppercase shadow-sm border-none">
                                                Expired
                                            </Badge>
                                        )}
                                    </TableCell>
                                </motion.tr>
                            ))
                        )}
                    </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                        <p className="text-sm text-slate-500 font-medium">
                            Page {page + 1} of {totalPages}
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0 || isFetching}
                                className="h-9 px-3 rounded-lg"
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Previous
                            </Button>

                            {/* Page numbers */}
                            <div className="hidden md:flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum: number;
                                    if (totalPages <= 5) {
                                        pageNum = i;
                                    } else if (page < 3) {
                                        pageNum = i;
                                    } else if (page > totalPages - 4) {
                                        pageNum = totalPages - 5 + i;
                                    } else {
                                        pageNum = page - 2 + i;
                                    }
                                    return (
                                        <Button
                                            key={pageNum}
                                            variant={page === pageNum ? 'default' : 'ghost'}
                                            size="sm"
                                            onClick={() => setPage(pageNum)}
                                            disabled={isFetching}
                                            className={cn(
                                                'h-9 w-9 rounded-lg',
                                                page === pageNum && 'bg-slate-900 text-white'
                                            )}
                                        >
                                            {pageNum + 1}
                                        </Button>
                                    );
                                })}
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1 || isFetching}
                                className="h-9 px-3 rounded-lg"
                            >
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}

// Stat Card Component
function StatCard({
    label,
    value,
    icon,
    color,
}: {
    label: string;
    value: number;
    icon: React.ReactNode;
    color: string;
}) {
    return (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                        {label}
                    </p>
                    <p className="text-2xl font-black text-slate-900">{value}</p>
                </div>
                <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center text-white', color)}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

// Inline Card component
function Card({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn('bg-white border border-slate-100', className)} {...props}>
            {children}
        </div>
    );
}

function cn(...inputs: (string | undefined | null | false)[]) {
    return inputs.filter(Boolean).join(' ');
}
