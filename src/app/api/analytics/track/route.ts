import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getLocationFromIP } from '@/lib/geolocation';

// Parse user agent for device info
function parseDeviceInfo(userAgent: string | null) {
    if (!userAgent) {
        return { deviceType: 'unknown', browser: 'unknown', os: 'unknown' };
    }

    // Device type
    let deviceType = 'desktop';
    if (/mobile/i.test(userAgent)) deviceType = 'mobile';
    else if (/tablet|ipad/i.test(userAgent)) deviceType = 'tablet';

    // Browser
    let browser = 'unknown';
    if (/chrome/i.test(userAgent) && !/edge/i.test(userAgent)) browser = 'Chrome';
    else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) browser = 'Safari';
    else if (/firefox/i.test(userAgent)) browser = 'Firefox';
    else if (/edge/i.test(userAgent)) browser = 'Edge';
    else if (/opera|opr/i.test(userAgent)) browser = 'Opera';

    // OS
    let os = 'unknown';
    if (/windows/i.test(userAgent)) os = 'Windows';
    else if (/macintosh|mac os/i.test(userAgent)) os = 'macOS';
    else if (/linux/i.test(userAgent) && !/android/i.test(userAgent)) os = 'Linux';
    else if (/android/i.test(userAgent)) os = 'Android';
    else if (/iphone|ipad|ipod/i.test(userAgent)) os = 'iOS';

    return { deviceType, browser, os };
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { events } = body;

        if (!events || !Array.isArray(events) || events.length === 0) {
            return NextResponse.json({ success: false, error: 'No events provided' }, { status: 400 });
        }

        // Get request metadata
        const userAgent = request.headers.get('user-agent') || undefined;
        const forwardedFor = request.headers.get('x-forwarded-for');
        const ipAddress = forwardedFor?.split(',')[0] || undefined;

        // Parse device info
        const deviceInfo = parseDeviceInfo(userAgent || null);

        // Get geolocation (async but we'll wait for it since it's cached)
        let geoData = { country: null as string | null, city: null as string | null, countryCode: null as string | null };
        if (ipAddress) {
            const location = await getLocationFromIP(ipAddress);
            geoData = {
                country: location.country,
                city: location.city,
                countryCode: location.countryCode,
            };
        }

        // Insert all events
        const eventData = events.map((event: any) => ({
            sessionId: event.sessionId || null,
            userId: event.userId || null,
            eventType: event.eventType || 'page_view',
            eventName: event.eventName || null,
            path: event.path || '/',
            referrer: event.referrer || null,
            userAgent,
            ipAddress,
            country: geoData.country,
            city: geoData.city,
            countryCode: geoData.countryCode,
            deviceType: deviceInfo.deviceType,
            browser: deviceInfo.browser,
            os: deviceInfo.os,
            duration: event.duration || null,
            metadata: event.metadata || null,
        }));

        await prisma.analyticsEvent.createMany({
            data: eventData,
        });

        return NextResponse.json({ success: true, count: events.length });
    } catch (error) {
        console.error('Analytics track error:', error);
        return NextResponse.json({ success: false, error: 'Failed to track event' }, { status: 500 });
    }
}
