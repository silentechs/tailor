'use client';

import { usePathname } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

// Generate a simple session ID for anonymous tracking
function generateSessionId(): string {
    if (typeof window === 'undefined') return '';

    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
        sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
}

interface AnalyticsEvent {
    sessionId: string;
    userId?: string;
    eventType: 'page_view' | 'click' | 'scroll' | 'custom';
    eventName?: string;
    path: string;
    referrer?: string;
    duration?: number;
    metadata?: Record<string, any>;
}

interface AnalyticsContextType {
    trackEvent: (event: Partial<AnalyticsEvent>) => void;
    trackClick: (elementName: string, metadata?: Record<string, any>) => void;
    userId?: string;
    setUserId: (id: string | undefined) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

// Event buffer for batching
let eventBuffer: AnalyticsEvent[] = [];
let flushTimeout: NodeJS.Timeout | null = null;

async function flushEvents() {
    if (eventBuffer.length === 0) return;

    const events = [...eventBuffer];
    eventBuffer = [];

    try {
        await fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ events }),
            // Use keepalive for page unload scenarios
            keepalive: true,
        });
    } catch (error) {
        // Silently fail - analytics shouldn't break the app
        console.debug('Analytics flush failed:', error);
    }
}

function scheduleFlush() {
    if (flushTimeout) return;
    flushTimeout = setTimeout(() => {
        flushTimeout = null;
        flushEvents();
    }, 2000); // Batch events every 2 seconds
}

export function AnalyticsProvider({
    children,
    userId: initialUserId
}: {
    children: React.ReactNode;
    userId?: string;
}) {
    const pathname = usePathname();
    const [userId, setUserId] = useState<string | undefined>(initialUserId);
    const sessionIdRef = useRef<string>('');
    const lastPathRef = useRef<string>('');
    const pageStartTimeRef = useRef<number>(Date.now());

    // Initialize session ID on client
    useEffect(() => {
        sessionIdRef.current = generateSessionId();
    }, []);

    // Update userId when prop changes
    useEffect(() => {
        if (initialUserId) {
            setUserId(initialUserId);
        }
    }, [initialUserId]);

    const trackEvent = useCallback((event: Partial<AnalyticsEvent>) => {
        const fullEvent: AnalyticsEvent = {
            sessionId: sessionIdRef.current,
            userId,
            eventType: event.eventType || 'custom',
            eventName: event.eventName,
            path: event.path || pathname,
            referrer: event.referrer || (typeof document !== 'undefined' ? document.referrer : undefined),
            duration: event.duration,
            metadata: event.metadata,
        };

        eventBuffer.push(fullEvent);
        scheduleFlush();
    }, [userId, pathname]);

    const trackClick = useCallback((elementName: string, metadata?: Record<string, any>) => {
        trackEvent({
            eventType: 'click',
            eventName: elementName,
            metadata,
        });
    }, [trackEvent]);

    // Track page views automatically
    useEffect(() => {
        if (!sessionIdRef.current) return;
        if (pathname === lastPathRef.current) return;

        // Calculate duration on previous page
        const duration = lastPathRef.current
            ? Math.round((Date.now() - pageStartTimeRef.current) / 1000)
            : undefined;

        // Track page view for new page
        trackEvent({
            eventType: 'page_view',
            path: pathname,
            duration: duration,
            referrer: lastPathRef.current || (typeof document !== 'undefined' ? document.referrer : undefined),
        });

        lastPathRef.current = pathname;
        pageStartTimeRef.current = Date.now();
    }, [pathname, trackEvent]);

    // Flush on page unload
    useEffect(() => {
        const handleUnload = () => {
            // Track final duration
            if (lastPathRef.current) {
                const duration = Math.round((Date.now() - pageStartTimeRef.current) / 1000);
                eventBuffer.push({
                    sessionId: sessionIdRef.current,
                    userId,
                    eventType: 'page_view',
                    eventName: 'page_exit',
                    path: pathname,
                    duration,
                });
            }
            flushEvents();
        };

        window.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                handleUnload();
            }
        });

        return () => {
            handleUnload();
        };
    }, [userId, pathname]);

    return (
        <AnalyticsContext.Provider value={{ trackEvent, trackClick, userId, setUserId }}>
            {children}
        </AnalyticsContext.Provider>
    );
}

export function useAnalytics() {
    const context = useContext(AnalyticsContext);
    if (!context) {
        // Return no-op functions if used outside provider
        return {
            trackEvent: () => { },
            trackClick: () => { },
            userId: undefined,
            setUserId: () => { },
        };
    }
    return context;
}
