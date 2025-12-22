'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  FileText,
  Loader2,
  Mail,
  Phone,
  Printer,
  Send,
  Trash2,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { fetchApi } from '@/lib/fetch-api';
import { downloadInvoicePDF } from '@/lib/pdf-generator';
import {
  cn,
  formatCurrency,
  formatDate,
  INVOICE_STATUS_COLORS,
  INVOICE_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
} from '@/lib/utils';

async function getInvoice(id: string) {
  const res = await fetchApi(`/api/invoices/${id}`);
  if (!res.ok) {
    throw new Error('Failed to fetch invoice');
  }
  const data = await res.json();
  return data.data;
}

const _statusFlow = ['DRAFT', 'SENT', 'VIEWED', 'PAID'];

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const queryClient = useQueryClient();

  const {
    data: invoice,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => getInvoice(id),
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const res = await fetchApi(`/api/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice status updated');
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetchApi(`/api/invoices/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete invoice');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Invoice deleted');
      router.push('/dashboard/invoices');
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const handleDownloadPDF = () => {
    if (!invoice) return;

    downloadInvoicePDF({
      invoiceNumber: invoice.invoiceNumber,
      createdAt: invoice.createdAt,
      dueDate: invoice.dueDate,
      status: invoice.status,
      businessName: invoice.tailor?.businessName || invoice.tailor?.name || 'StitchCraft Ghana',
      businessAddress: invoice.tailor?.businessAddress,
      businessPhone: invoice.tailor?.phone,
      businessEmail: invoice.tailor?.email,
      businessRegion: invoice.tailor?.region,
      businessCity: invoice.tailor?.city,
      clientName: invoice.client?.name,
      clientPhone: invoice.client?.phone,
      clientEmail: invoice.client?.email,
      clientAddress: invoice.client?.address,
      items: invoice.items || [],
      subtotal: Number(invoice.subtotal),
      vatAmount: Number(invoice.vatAmount),
      nhilAmount: Number(invoice.nhilAmount),
      getfundAmount: Number(invoice.getfundAmount),
      totalAmount: Number(invoice.totalAmount),
      paidAmount: Number(invoice.paidAmount),
      notes: invoice.notes,
      termsConditions: invoice.termsConditions,
      orderNumber: invoice.order?.orderNumber,
    });

    toast.success('PDF downloaded successfully');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12 h-[50vh] items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">Error loading invoice details.</p>
        <Button variant="outline" asChild>
          <Link href="/dashboard/invoices">Back to Invoices</Link>
        </Button>
      </div>
    );
  }

  const paidAmount = Number(invoice.paidAmount);
  const totalAmount = Number(invoice.totalAmount);
  const balance = totalAmount - paidAmount;
  const items = (invoice.items as any[]) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/invoices">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold font-heading text-primary">
                #{invoice.invoiceNumber}
              </h1>
              <Badge className={cn('text-[10px]', INVOICE_STATUS_COLORS[invoice.status])}>
                {INVOICE_STATUS_LABELS[invoice.status]}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">Created on {formatDate(invoice.createdAt)}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          {invoice.status === 'DRAFT' && (
            <Button
              onClick={() => statusMutation.mutate('SENT')}
              disabled={statusMutation.isPending}
            >
              {statusMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Mark as Sent
            </Button>
          )}
          {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
            <Select
              value={invoice.status}
              onValueChange={(value) => statusMutation.mutate(value)}
              disabled={statusMutation.isPending}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(INVOICE_STATUS_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Invoice Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Items Table */}
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-bold">Description</TableHead>
                    <TableHead className="text-center font-bold">Qty</TableHead>
                    <TableHead className="text-right font-bold">Unit Price</TableHead>
                    <TableHead className="text-right font-bold">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item: any) => (
                    <TableRow key={`${item.description}-${item.amount}-${item.quantity}`}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Separator className="my-6" />

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-full max-w-xs space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>VAT (15%)</span>
                    <span>{formatCurrency(invoice.vatAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>NHIL (2.5%)</span>
                    <span>{formatCurrency(invoice.nhilAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>GETFUND (2.5%)</span>
                    <span>{formatCurrency(invoice.getfundAmount)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(totalAmount)}</span>
                  </div>
                  {paidAmount > 0 && (
                    <>
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Paid</span>
                        <span>{formatCurrency(paidAmount)}</span>
                      </div>
                      {balance > 0 && (
                        <div className="flex justify-between font-bold text-destructive">
                          <span>Balance Due</span>
                          <span>{formatCurrency(balance)}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payments Card */}
          {invoice.payments && invoice.payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-green-500" />
                  Payment History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {invoice.payments.map((payment: any) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between py-3 border-b last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">#{payment.paymentNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            {PAYMENT_METHOD_LABELS[payment.method] || payment.method}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{formatCurrency(payment.amount)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(payment.paidAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {(invoice.notes || invoice.termsConditions) && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                {invoice.notes && (
                  <div>
                    <h4 className="text-sm font-bold text-muted-foreground mb-2">Notes</h4>
                    <p className="text-sm bg-muted/30 p-3 rounded-md">{invoice.notes}</p>
                  </div>
                )}
                {invoice.termsConditions && (
                  <div>
                    <h4 className="text-sm font-bold text-muted-foreground mb-2">
                      Terms & Conditions
                    </h4>
                    <p className="text-sm bg-muted/30 p-3 rounded-md">{invoice.termsConditions}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-4 w-4" />
                Client
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Link
                  href={`/dashboard/clients/${invoice.client?.id}`}
                  className="font-medium text-primary hover:underline text-lg"
                >
                  {invoice.client?.name}
                </Link>
                {invoice.client?.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                    <Phone className="h-3 w-3" />
                    {invoice.client.phone}
                  </div>
                )}
                {invoice.client?.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Mail className="h-3 w-3" />
                    {invoice.client.email}
                  </div>
                )}
              </div>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/dashboard/clients/${invoice.client?.id}`}>View Profile</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Invoice Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Invoice Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  Created
                </span>
                <span>{formatDate(invoice.createdAt)}</span>
              </div>
              {invoice.dueDate && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    Due Date
                  </span>
                  <span
                    className={cn(
                      new Date(invoice.dueDate) < new Date() && invoice.status !== 'PAID'
                        ? 'text-red-500 font-bold'
                        : ''
                    )}
                  >
                    {formatDate(invoice.dueDate)}
                  </span>
                </div>
              )}
              {invoice.sentAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sent</span>
                  <span>{formatDate(invoice.sentAt)}</span>
                </div>
              )}
              {invoice.viewedAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Viewed</span>
                  <span>{formatDate(invoice.viewedAt)}</span>
                </div>
              )}
              {invoice.paidAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Paid</span>
                  <span className="text-green-600">{formatDate(invoice.paidAt)}</span>
                </div>
              )}
              {invoice.order && (
                <div className="pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Linked Order</span>
                  <Link
                    href={`/dashboard/orders/${invoice.order.id}`}
                    className="block text-primary hover:underline font-medium mt-1"
                  >
                    #{invoice.order.orderNumber}
                  </Link>
                </div>
              )}
            </CardContent>
            {invoice.status === 'DRAFT' && (
              <CardFooter>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this draft invoice?')) {
                      deleteMutation.mutate();
                    }
                  }}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Delete Draft
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
