import { NextResponse } from 'next/server';
import {
  generateOrderTimeline,
  getClientOrders,
  getClientPayments,
  validateTrackingToken,
} from '@/lib/client-tracking-service';
import { generateTrackingQR } from '@/lib/qr-generator';

type RouteParams = { params: Promise<{ token: string }> };

// GET /api/track/[token] - Get client tracking portal data
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { token } = await params;

    // Validate token
    const validation = await validateTrackingToken(token);

    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
        },
        { status: 401 }
      );
    }

    const client = validation.client!;
    const tailor = validation.tailor!;

    // Get client data
    const [orders, payments] = await Promise.all([
      getClientOrders(client.id),
      getClientPayments(client.id),
    ]);

    // Generate order timelines
    const ordersWithTimelines = orders.map((order) => ({
      ...order,
      timeline: generateOrderTimeline(order),
    }));

    // Generate QR code for sharing
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const trackingUrl = `${appUrl}/track/${token}`;
    const qrCode = await generateTrackingQR(trackingUrl);

    return NextResponse.json({
      success: true,
      data: {
        client: {
          id: client.id,
          name: client.name,
          phone: client.phone,
        },
        tailor: {
          name: tailor.name,
          businessName: tailor.businessName,
          phone: tailor.phone,
          profileImage: tailor.profileImage,
        },
        orders: ordersWithTimelines,
        payments,
        trackingUrl,
        qrCode: qrCode.dataUrl,
      },
    });
  } catch (error) {
    console.error('Get tracking data error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch tracking data',
      },
      { status: 500 }
    );
  }
}
