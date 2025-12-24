'use client';

import { useQuery } from '@tanstack/react-query';
import {
  CreditCard,
  Edit,
  Image as ImageIcon,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Ruler,
  Scissors,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ClientDesignUploadDialog } from '@/components/clients/client-design-upload-dialog';
import { MeasurementSyncDialog } from '@/components/clients/measurement-sync-dialog';
import { MeasurementUpdateDialog } from '@/components/clients/measurement-update-dialog';
import { PushToProfileButton } from '@/components/clients/push-to-profile-button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fetchApi } from '@/lib/fetch-api';
import { formatCurrency, formatPhoneDisplay } from '@/lib/utils';
import { columns as orderColumns } from '../../orders/columns';

async function getClient(id: string) {
  const res = await fetchApi(`/api/clients/${id}`);
  if (!res.ok) {
    throw new Error('Failed to fetch client');
  }
  const data = await res.json();
  return data.data;
}

export default function ClientProfilePage() {
  const params = useParams();
  const id = params?.id as string;

  const {
    data: clientData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['client', id],
    queryFn: () => getClient(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12 h-[50vh] items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !clientData) {
    return <div className="text-center py-12 text-red-500">Error loading client profile.</div>;
  }

  // Transform orders for table
  const clientOrders =
    clientData.orders?.map((order: any) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      clientName: clientData.name,
      garmentType: order.garmentType.replace(/_/g, ' '),
      status: order.status,
      paymentStatus:
        order.paidAmount >= order.totalAmount
          ? 'COMPLETED'
          : order.paidAmount > 0
            ? 'PARTIAL'
            : 'PENDING',
      amount: Number(order.totalAmount),
      dueDate: order.deadline ? new Date(order.deadline).toLocaleDateString() : 'N/A',
    })) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 border-2 border-primary">
            <AvatarImage src={clientData.profileImage || ''} />
            <AvatarFallback className="text-xl bg-primary/10 text-primary font-bold">
              {clientData.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold font-heading text-primary flex items-center gap-2">
              {clientData.name}
              <Badge
                variant="outline"
                className="ml-2 text-sm font-normal border-primary/20 text-primary"
              >
                Active
              </Badge>
              {clientData.isLead && (
                <Badge className="ml-2 text-sm font-black bg-ghana-gold text-black border-none uppercase">
                  Lead
                </Badge>
              )}
            </h1>
            <div className="flex items-center gap-4 text-muted-foreground mt-1 text-sm">
              {clientData.region && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {clientData.region}
                </div>
              )}
              <div className="flex items-center gap-1">
                <span className="text-xs bg-secondary/30 px-2 py-0.5 rounded-full text-secondary-foreground font-medium">
                  Joined {new Date(clientData.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/clients/${clientData.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/dashboard/orders/new?clientId=${clientData.id}`}>
              <Scissors className="h-4 w-4 mr-2" />
              New Order
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Sidebar Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">
                    {formatPhoneDisplay(clientData.phone)}
                  </p>
                </div>
              </div>
              <Separator />
              {clientData.email && (
                <>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">{clientData.email}</p>
                    </div>
                  </div>
                  <Separator />
                </>
              )}
              {clientData.address && (
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Address</p>
                    <p className="text-sm text-muted-foreground">{clientData.address}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Financial Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Spent</span>
                <span className="text-lg font-bold font-mono">
                  {formatCurrency(clientData.stats?.totalPaid || 0)}
                </span>
              </div>
              <Separator className="bg-primary/20" />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Orders</span>
                <span className="font-medium">{clientData.stats?.totalOrders || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Balance Due</span>
                <span className="font-medium text-destructive">
                  {formatCurrency(clientData.stats?.balance || 0)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <div className="md:col-span-2">
          <Tabs defaultValue="orders" className="w-full">
            <TabsList className="w-full justify-start mb-4 bg-transparent p-0 border-b rounded-none h-auto">
              <TabsTrigger
                value="orders"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
              >
                Orders History
              </TabsTrigger>
              <TabsTrigger
                value="measurements"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
              >
                Measurements
              </TabsTrigger>
              <TabsTrigger
                value="designs"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
              >
                Designs
              </TabsTrigger>
              <TabsTrigger
                value="notes"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
              >
                Notes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>History of all orders for this client.</CardDescription>
                </CardHeader>
                <CardContent>
                  <DataTable columns={orderColumns} data={clientOrders} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="measurements" className="mt-0">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Current Measurements</CardTitle>
                    <CardDescription>Last updated with recent order</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {clientData.user?.measurements && (
                      <MeasurementSyncDialog
                        clientId={clientData.id}
                        clientName={clientData.name}
                        tailorMeasurements={clientData.measurements}
                        clientProfileMeasurements={clientData.user.measurements as Record<string, any>}
                        tailorUnit={clientData.unit}
                        onSyncComplete={() => window.location.reload()}
                      />
                    )}
                    <PushToProfileButton
                      clientId={clientData.id}
                      clientName={clientData.name}
                      measurements={clientData.measurements}
                      unit={clientData.unit}
                      hasLinkedAccount={!!clientData.userId}
                      onPushComplete={() => window.location.reload()}
                    />
                    <MeasurementUpdateDialog
                      clientId={clientData.id}
                      clientName={clientData.name}
                      measurements={clientData.measurements}
                      unit={clientData.unit}
                      onUpdateComplete={() => window.location.reload()}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  {(() => {
                    // Extract actual measurement values - handle nested structure
                    let measurementData = clientData.measurements || {};

                    // If measurements contains a nested 'values' object, use that
                    if (measurementData.values && typeof measurementData.values === 'object') {
                      measurementData = measurementData.values;
                    }

                    // Filter out metadata keys, keep only numeric measurement values
                    const measurementEntries = Object.entries(measurementData).filter(
                      ([key, value]) =>
                        !['unit', 'updatedAt', 'createdAt', 'id', 'clientId', 'templateId', 'notes', 'sketch', 'isSynced', 'clientSideId'].includes(key) &&
                        (typeof value === 'number' || (typeof value === 'string' && !isNaN(parseFloat(value))))
                    );

                    if (measurementEntries.length > 0) {
                      return (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                          {measurementEntries.map(([key, value]) => (
                            <div key={key} className="space-y-1 bg-muted/30 p-4 rounded-lg border">
                              <p className="text-sm font-medium text-muted-foreground capitalize flex items-center gap-2">
                                <Ruler className="h-3 w-3" />
                                {key.replace(/_/g, ' ')}
                              </p>
                              <p className="text-2xl font-bold">
                                {typeof value === 'number' ? value.toFixed(1) : String(value)}
                                <span className="text-sm font-normal text-muted-foreground ml-1">
                                  {clientData.unit === 'CM' ? 'cm' : '"'}
                                </span>
                              </p>
                            </div>
                          ))}
                        </div>
                      );
                    }

                    return (
                      <div className="text-center py-8 text-muted-foreground">
                        No measurements recorded yet.
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="designs" className="mt-0">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Designs & References</CardTitle>
                    <CardDescription>Inspirations from client or uploaded by you.</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Trigger upload dialog (will be implemented via state)
                      const event = new CustomEvent('open-design-upload', {
                        detail: { clientId: clientData.id },
                      });
                      window.dispatchEvent(event);
                    }}
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Add Design
                  </Button>
                </CardHeader>
                <CardContent>
                  {clientData.userDesigns && clientData.userDesigns.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {clientData.userDesigns.map((design: any) => (
                        <div
                          key={design.id}
                          className="group relative aspect-[3/4] rounded-lg overflow-hidden border bg-muted"
                        >
                          <img
                            src={design.images[0] || '/placeholder-garment.jpg'}
                            alt="Design"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                            <div>
                              <p className="text-white text-xs font-bold uppercase tracking-wider">
                                {design.garmentType}
                              </p>
                              {design.notes && (
                                <p className="text-white/80 text-xs line-clamp-2 mt-1">
                                  {design.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                      <ImageIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground font-medium">No designs found.</p>
                      <p className="text-muted-foreground text-sm mt-1">
                        If the client uploads photos to their profile, they will appear here.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Client Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  {clientData.notes ? (
                    <p className="text-muted-foreground whitespace-pre-wrap">{clientData.notes}</p>
                  ) : (
                    <p className="text-muted-foreground">No notes added yet.</p>
                  )}
                  <Button variant="outline" className="mt-4">
                    Edit Notes
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <ClientDesignUploadDialog />
    </div>
  );
}
