'use client';

import { useQuery } from '@tanstack/react-query';
import { BadgeCheck, Clock, Mail, MessageSquare, RefreshCcw, TriangleAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export default function CommunicationsPage() {
  const {
    data: logs,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['comm-logs'],
    queryFn: async () => {
      const res = await fetch('/api/communications/logs');
      if (!res.ok) throw new Error('Failed to fetch logs');
      return res.json();
    },
  });

  const smsLogs = logs?.data?.sms || [];
  const emailLogs = logs?.data?.emails || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold font-heading text-primary">Outbox</h1>
          <p className="text-muted-foreground mt-2">Track SMS and Email delivery status.</p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="p-2 hover:bg-muted rounded-full transition-colors"
          title="Refresh"
        >
          <RefreshCcw className={cn('h-5 w-5', isLoading && 'animate-spin')} />
        </button>
      </div>

      <Tabs defaultValue="sms" className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="sms" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> SMS
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" /> Email
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sms" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>SMS Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {smsLogs.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">No SMS sent yet.</div>
                ) : (
                  smsLogs.map((log: any) => (
                    <div key={log.id} className="py-4 flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-bold text-sm">{log.recipient}</p>
                        <p className="text-xs text-muted-foreground max-w-md truncate">
                          {log.message}
                        </p>
                        <div className="flex items-center gap-4 text-[10px] text-muted-foreground uppercase font-black">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {new Date(log.sentAt).toLocaleString()}
                          </span>
                          {log.provider && <span>Provider: {log.provider}</span>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <StatusBadge status={log.status} />
                        {log.deliveredAt && (
                          <span className="text-[10px] text-emerald-600 flex items-center gap-1">
                            <BadgeCheck className="h-3 w-3" /> Delivered
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {emailLogs.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">No emails sent yet.</div>
                ) : (
                  emailLogs.map((log: any) => (
                    <div key={log.id} className="py-4 flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-bold text-sm">{log.recipient}</p>
                        <p className="text-xs font-semibold">{log.subject}</p>
                        <div className="flex items-center gap-4 text-[10px] text-muted-foreground uppercase font-black">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {new Date(log.sentAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <StatusBadge status={log.status} />
                        {log.openedAt && (
                          <span className="text-[10px] text-emerald-600 flex items-center gap-1">
                            <BadgeCheck className="h-3 w-3" /> Opened
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status.toUpperCase()) {
    case 'SENT':
    case 'DELIVERED':
      return <Badge className="bg-emerald-500 hover:bg-emerald-600">Sent</Badge>;
    case 'FAILED':
    case 'ERROR':
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <TriangleAlert className="h-3 w-3" /> Failed
        </Badge>
      );
    case 'PENDING':
      return <Badge variant="secondary">Pending</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
