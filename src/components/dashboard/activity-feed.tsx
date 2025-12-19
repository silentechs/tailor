'use client';

import { useQuery } from '@tanstack/react-query';
import { CreditCard, FileText, History, Loader2, Settings, User, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';

async function getAuditLogs() {
  const res = await fetch('/api/audit-logs');
  if (!res.ok) throw new Error('Failed to fetch logs');
  return res.json();
}

export function ActivityFeed() {
  const { data: logsData, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: getAuditLogs,
  });

  const logs = logsData?.data || [];

  const getActionIcon = (action: string) => {
    if (action.includes('ORDER')) return <FileText className="h-3 w-3 text-blue-500" />;
    if (action.includes('PAYMENT')) return <CreditCard className="h-3 w-3 text-emerald-500" />;
    if (action.includes('PROFILE') || action.includes('SETTING'))
      return <Settings className="h-3 w-3 text-slate-500" />;
    if (action.includes('CLIENT')) return <User className="h-3 w-3 text-orange-500" />;
    return <Zap className="h-3 w-3 text-slate-400" />;
  };

  const formatAction = (action: string) => {
    return action.replace(/_/g, ' ').toLowerCase();
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Activity Feed
        </CardTitle>
        <CardDescription>Recent actions performed in your workshop</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary opacity-20" />
          </div>
        ) : logs.length > 0 ? (
          <div className="space-y-4 relative before:absolute before:inset-0 before:left-[11px] before:w-px before:bg-slate-100 before:h-full pb-2">
            {logs.map((log: any) => (
              <div key={log.id} className="flex gap-3 relative">
                <div className="h-6 w-6 rounded-full bg-white border shadow-sm flex items-center justify-center z-10 shrink-0">
                  {getActionIcon(log.action)}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 capitalize">
                    {formatAction(log.action)}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {log.resource} {log.resourceId} • {formatDate(log.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 opacity-60">
            <p className="text-sm">No activity recorded yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
