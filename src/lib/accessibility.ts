/**
 * Accessibility utilities for StitchCraft Ghana
 * Provides helpers for ARIA attributes, keyboard navigation, and screen reader support
 */

import type { RefObject, KeyboardEvent } from 'react';

// ============================================
// Focus Management
// ============================================

/**
 * Traps focus within a container element (for modals/dialogs)
 */
export function trapFocus(container: HTMLElement) {
    const focusableSelectors = [
        'button:not([disabled])',
        'a[href]',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    const focusableElements = container.querySelectorAll<HTMLElement>(focusableSelectors);
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    function handleKeyDown(e: globalThis.KeyboardEvent) {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
            if (document.activeElement === firstFocusable) {
                e.preventDefault();
                lastFocusable?.focus();
            }
        } else {
            if (document.activeElement === lastFocusable) {
                e.preventDefault();
                firstFocusable?.focus();
            }
        }
    }

    container.addEventListener('keydown', handleKeyDown);
    firstFocusable?.focus();

    return () => {
        container.removeEventListener('keydown', handleKeyDown);
    };
}

// ============================================
// Skip to Content Link
// ============================================

/**
 * Props for skip link component
 */
export interface SkipLinkProps {
    href?: string;
    children?: React.ReactNode;
}

/**
 * CSS classes for skip link (visually hidden but accessible to keyboard)
 */
export const skipLinkClasses = `
  absolute left-0 top-0 -translate-y-full
  focus:translate-y-0
  bg-primary text-white
  px-4 py-2 z-[9999]
  font-semibold text-sm
  transition-transform duration-200
`;

// ============================================
// Keyboard Navigation Helpers
// ============================================

/**
 * Handle keyboard navigation for lists (arrow keys)
 */
export function handleListKeyDown(
    e: KeyboardEvent<HTMLElement>,
    items: HTMLElement[],
    currentIndex: number,
    onSelect?: (index: number) => void
) {
    switch (e.key) {
        case 'ArrowDown':
            e.preventDefault();
            const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
            items[nextIndex]?.focus();
            break;
        case 'ArrowUp':
            e.preventDefault();
            const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
            items[prevIndex]?.focus();
            break;
        case 'Home':
            e.preventDefault();
            items[0]?.focus();
            break;
        case 'End':
            e.preventDefault();
            items[items.length - 1]?.focus();
            break;
        case 'Enter':
        case ' ':
            e.preventDefault();
            onSelect?.(currentIndex);
            break;
    }
}

// ============================================
// Screen Reader Announcements
// ============================================

let announcer: HTMLDivElement | null = null;

/**
 * Announce a message to screen readers
 */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    if (typeof window === 'undefined') return;

    if (!announcer) {
        announcer = document.createElement('div');
        announcer.setAttribute('aria-live', priority);
        announcer.setAttribute('aria-atomic', 'true');
        announcer.className = 'sr-only';
        announcer.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;
        document.body.appendChild(announcer);
    }

    announcer.setAttribute('aria-live', priority);
    announcer.textContent = '';

    // Use requestAnimationFrame to ensure the DOM update is noticed by screen readers
    requestAnimationFrame(() => {
        if (announcer) {
            announcer.textContent = message;
        }
    });
}

// ============================================
// ARIA Attribute Helpers
// ============================================

/**
 * Generate ARIA attributes for a button that controls a menu/dropdown
 */
export function getMenuButtonProps(isOpen: boolean, menuId: string) {
    return {
        'aria-expanded': isOpen,
        'aria-haspopup': 'menu' as const,
        'aria-controls': menuId,
    };
}

/**
 * Generate ARIA attributes for a menu/dropdown
 */
export function getMenuProps(menuId: string) {
    return {
        id: menuId,
        role: 'menu' as const,
        'aria-orientation': 'vertical' as const,
    };
}

/**
 * Generate ARIA attributes for a menu item
 */
export function getMenuItemProps(index: number) {
    return {
        role: 'menuitem' as const,
        tabIndex: index === 0 ? 0 : -1,
    };
}

// ============================================
// Loading State Utilities
// ============================================

/**
 * Generate ARIA attributes for loading states
 */
export function getLoadingProps(isLoading: boolean, loadingText = 'Loading...') {
    return {
        'aria-busy': isLoading,
        'aria-describedby': isLoading ? 'loading-indicator' : undefined,
    };
}

// ============================================
// Form Accessibility
// ============================================

/**
 * Generate ARIA attributes for form fields with validation
 */
export function getFieldProps(fieldId: string, error?: string) {
    return {
        id: fieldId,
        'aria-invalid': !!error,
        'aria-describedby': error ? `${fieldId}-error` : undefined,
    };
}

/**
 * Generate attributes for error messages
 */
export function getErrorProps(fieldId: string) {
    return {
        id: `${fieldId}-error`,
        role: 'alert' as const,
        'aria-live': 'polite' as const,
    };
}

// ============================================
// Color Contrast Utilities
// ============================================

/**
 * Check if text color should be light or dark based on background
 */
export function getContrastTextColor(bgColor: string): 'text-white' | 'text-black' {
    // Remove # if present
    const hex = bgColor.replace('#', '');

    // Convert to RGB
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);

    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.5 ? 'text-black' : 'text-white';
}
