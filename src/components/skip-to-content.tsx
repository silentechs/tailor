'use client';

import Link from 'next/link';

/**
 * Skip to Content Link
 * Allows keyboard users to skip navigation and jump directly to main content
 * Becomes visible on focus for keyboard navigation
 */
export function SkipToContent() {
  return (
    <Link
      href="#main-content"
      className="
        sr-only focus:not-sr-only
        fixed left-4 top-4 z-[9999]
        bg-primary text-white
        px-4 py-2 rounded-md
        font-semibold text-sm
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
        shadow-lg
        transition-all duration-200
      "
    >
      Skip to main content
    </Link>
  );
}
