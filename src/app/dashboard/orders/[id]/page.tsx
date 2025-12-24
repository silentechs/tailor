'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  CreditCard,
  FileText,
  Loader2,
  PenTool,
  Phone,
  Printer,
  Ruler,
  Scissors,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { MaterialsList } from '@/components/orders/materials-list';
import { PaymentDialog } from '@/components/orders/payment-dialog';
import { ProgressPhotos } from '@/components/orders/progress-photos';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/ui/status-badge';
import { MeasurementSketcher } from '@/components/workshop/measurement-sketcher';
import { OrderTaskBoard } from '@/components/workshop/order-task-board';
import { fetchApi } from '@/lib/fetch-api';
import { downloadInvoicePDF } from '@/lib/pdf-generator';
import {
  formatCurrency,
  formatDate,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
} from '@/lib/utils';

async function getOrder(id: string) {
  const res = await fetchApi(`/api/orders/${id}`);
  if (!res.ok) {
    throw new Error('Failed to fetch order');
  }
  const data = await res.json();
  return data.data;
}

export default function OrderDetailsPage() {
  const params = useParams();
  const id = params?.id as string;
  const queryClient = useQueryClient();
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  const {
    data: orderData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrder(id),
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const res = await fetchApi(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      toast.success('Order status updated');
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const notifyMutation = useMutation({
    mutationFn: async (type: string) => {
      const res = await fetchApi(`/api/orders/${id}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) throw new Error('Failed to send notification');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Notification sent successfully');
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        clientId: orderData.clientId,
        orderId: orderData.id,
        items: [
          {
            description: `${orderData.garmentType.replace(/_/g, ' ')} - Custom Tailoring`,
            quantity: 1,
            unitPrice: Number(orderData.totalAmount),
            amount: Number(orderData.totalAmount),
          },
        ],
        template: 'modern',
        dueDate: orderData.deadline,
        notes: `Invoice for order ${orderData.orderNumber}`,
      };

      const res = await fetchApi('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create invoice');
      }

      return res.json();
    },
    onSuccess: () => {
      toast.success('Professional invoice created in the database');
      queryClient.invalidateQueries({ queryKey: ['order', id] });
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12 h-[50vh] items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !orderData) {
    return <div className="text-center py-12 text-red-500">Error loading order details.</div>;
  }

  // Helper to determine payment status based on API data
  const paidAmount =
    orderData.payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;
  const totalAmount = Number(orderData.totalAmount);
  const paymentStatus =
    paidAmount >= totalAmount ? 'COMPLETED' : paidAmount > 0 ? 'PARTIAL' : 'PENDING';
  const balance = totalAmount - paidAmount;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold font-heading text-primary">
              {orderData.orderNumber}
            </h1>
            <StatusBadge
              status={orderData.status}
              colorMap={ORDER_STATUS_COLORS}
              labelMap={ORDER_STATUS_LABELS}
            />
          </div>
          <p className="text-muted-foreground mt-1">Created on {formatDate(orderData.createdAt)}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              const invoiceData = {
                invoiceNumber: orderData.orderNumber,
                createdAt: orderData.createdAt,
                dueDate: orderData.dueDate,
                status: orderData.status,
                businessName:
                  orderData.tailor?.businessName || orderData.tailor?.name || 'StitchCraft Ghana',
                businessPhone: orderData.tailor?.phone,
                businessEmail: orderData.tailor?.email,
                clientName: orderData.client?.name,
                clientPhone: orderData.client?.phone,
                clientEmail: orderData.client?.email,
                items: [
                  {
                    description: `${orderData.garmentType?.replace(/_/g, ' ')} - Custom Tailoring`,
                    quantity: 1,
                    unitPrice: Number(orderData.totalAmount),
                    amount: Number(orderData.totalAmount),
                  },
                ],
                subtotal: Number(orderData.totalAmount),
                vatAmount: 0,
                nhilAmount: 0,
                getfundAmount: 0,
                totalAmount: Number(orderData.totalAmount),
                paidAmount: Number(orderData.paidAmount),
                notes: orderData.description,
              };
              await downloadInvoicePDF(invoiceData);
              toast.success('Invoice PDF downloaded');
            }}
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Quick PDF
          </Button>
          {orderData.invoices && orderData.invoices.length > 0 ? (
            <Button variant="default" asChild>
              <Link href={`/dashboard/invoices/${orderData.invoices[0].id}`}>
                <FileText className="h-4 w-4 mr-2" />
                View Invoice
              </Link>
            </Button>
          ) : (
            <Button
              variant="default"
              onClick={() => createInvoiceMutation.mutate()}
              disabled={createInvoiceMutation.isPending}
            >
              {createInvoiceMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              Generate Official Invoice
            </Button>
          )}
          <Select
            defaultValue={orderData.status}
            onValueChange={(value) => statusMutation.mutate(value)}
            disabled={statusMutation.isPending}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Update Status" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Order Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scissors className="h-5 w-5 text-primary" />
                Garment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Garment Type</p>
                  <p className="font-medium text-lg">{orderData.garmentType.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Due Date</p>
                  <div className="flex items-center gap-2 font-medium text-lg">
                    <Calendar className="h-4 w-4 text-primary" />
                    {orderData.deadline ? formatDate(orderData.deadline) : 'No Deadline'}
                  </div>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Description / Notes
                </p>
                <p className="text-sm leading-relaxed bg-muted/30 p-3 rounded-md border">
                  {orderData.garmentDescription || 'No description provided.'}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Ruler className="h-4 w-4" />
                  Measurements Used
                </p>
                {orderData.measurement?.values &&
                  Object.keys(orderData.measurement.values).length > 0 ? (
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                    {Object.entries(orderData.measurement.values as Record<string, any>).map(
                      ([key, value]) => (
                        <div key={key} className="text-center p-2 bg-muted/20 rounded border">
                          <span className="text-xs text-muted-foreground uppercase block mb-1">
                            {key}
                          </span>
                          <span className="font-bold">{String(value)}"</span>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No measurements recorded for this order.
                  </p>
                )}

                <div className="mt-6">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <PenTool className="h-4 w-4 mr-2" />
                        {orderData.measurement?.sketch
                          ? 'View/Edit Design Sketch'
                          : 'Create Design Sketch'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Design Sketch & Annotations</DialogTitle>
                        <DialogDescription>
                          Draw style details or specific construction notes for this garment.
                        </DialogDescription>
                      </DialogHeader>
                      {orderData.measurement?.id ? (
                        <MeasurementSketcher
                          id={orderData.measurement.id}
                          initialSketch={orderData.measurement.sketch}
                          onSaveSuccess={() => {
                            queryClient.invalidateQueries({ queryKey: ['order', id] });
                            // Close dialog by invalidating? No need, but maybe good UX to just show toast.
                            // setIsPaymentDialogOpen(false); // Wrong dialog
                          }}
                        />
                      ) : (
                        <p className="text-center py-10 text-muted-foreground italic">
                          No measurement record attached to this order. Please attach one to use
                          sketching.
                        </p>
                      )}
                    </DialogContent>
                  </Dialog>

                  {/* Sketch Preview */}
                  {orderData.measurement?.sketch && (
                    <div className="mt-4 border rounded-lg overflow-hidden bg-white shadow-sm">
                      <div className="p-2 border-b bg-muted/20 flex justify-between items-center">
                        <span className="text-xs font-medium text-muted-foreground">
                          Design Sketch Preview
                        </span>
                      </div>
                      <div className="relative aspect-[4/3] w-full bg-white">
                        <img
                          src={orderData.measurement.sketch}
                          alt="Design Sketch"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <MaterialsList orderId={id} />
              <ProgressPhotos orderId={id} initialPhotos={orderData.progressPhotos} />
            </CardContent>
          </Card>

          {/* Financials */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Financials
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="text-lg font-bold">{formatCurrency(orderData.totalAmount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Paid to Date</span>
                  <span className="text-lg font-medium text-green-600">
                    {formatCurrency(paidAmount)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="font-medium">Balance Due</span>
                  <span className="text-xl font-bold text-destructive">
                    {formatCurrency(balance)}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/20 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <StatusBadge
                  status={paymentStatus}
                  colorMap={PAYMENT_STATUS_COLORS}
                  labelMap={PAYMENT_STATUS_LABELS}
                />
              </div>
              <Button
                size="sm"
                onClick={() => setIsPaymentDialogOpen(true)}
                disabled={balance <= 0}
              >
                Record Payment
              </Button>
            </CardFooter>
          </Card>

          <OrderTaskBoard orderId={id} />
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
                  href={`/dashboard/clients/${orderData.client.id}`}
                  className="font-medium text-primary hover:underline text-lg"
                >
                  {orderData.client.name}
                </Link>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                  <Phone className="h-3 w-3" />
                  {orderData.client.phone}
                </div>
              </div>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/dashboard/clients/${orderData.client.id}`}>View Profile</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Select
                defaultValue={orderData.status}
                onValueChange={(value) => statusMutation.mutate(value)}
                disabled={statusMutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Change Status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="secondary"
                className="w-full justify-start"
                onClick={() => notifyMutation.mutate('INVOICE')}
                disabled={notifyMutation.isPending}
              >
                {notifyMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                Send Invoice via SMS
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <PaymentDialog
        order={orderData}
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
      />
    </div>
  );
}
