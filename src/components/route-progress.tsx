'use client';

import NProgress from 'nprogress';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

// Configure NProgress with Ghana-themed primary color
NProgress.configure({
    showSpinner: false,
    trickleSpeed: 200,
    minimum: 0.1,
});

function RouteProgressHandler() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Start progress when route changes
        NProgress.done();
    }, [pathname, searchParams]);

    return null;
}

/**
 * Route Progress Indicator
 * Shows a thin progress bar at the top during route transitions
 * Uses the Ghana-themed primary color from design system
 */
export function RouteProgress() {
    return (
        <>
            {/* NProgress styles with Ghana-themed primary color */}
            <style jsx global>{`
        #nprogress {
          pointer-events: none;
        }

        #nprogress .bar {
          background: var(--color-ghana-green, #006B3F);
          position: fixed;
          z-index: 9999;
          top: 0;
          left: 0;
          width: 100%;
          height: 3px;
        }

        #nprogress .peg {
          display: block;
          position: absolute;
          right: 0px;
          width: 100px;
          height: 100%;
          box-shadow: 0 0 10px var(--color-ghana-green, #006B3F),
            0 0 5px var(--color-ghana-green, #006B3F);
          opacity: 1;
          transform: rotate(3deg) translate(0px, -4px);
        }
      `}</style>
            <Suspense fallback={null}>
                <RouteProgressHandler />
            </Suspense>
        </>
    );
}

/**
 * Programmatic control for starting/stopping progress
 * Use these when initiating navigation from code
 */
export function startProgress() {
    NProgress.start();
}

export function stopProgress() {
    NProgress.done();
}
