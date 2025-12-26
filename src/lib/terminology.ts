/**
 * Terminology constants for StitchCraft Ghana.
 * Use these instead of hardcoded strings to ensure consistent branding.
 */

export const UI_LABELS = {
    TAILOR: 'Fashion Designer',
    TAILORS: 'Fashion Designers',
    ARTISAN: 'Artisan',
    ARTISANS: 'Artisans',
    WORKSHOP: 'Studio',
    STUDIO: 'Studio Hub',
    CLIENT: 'Client',
    CLIENTS: 'Clients',
} as const;

export const ROLE_DISPLAY_NAMES: Record<string, string> = {
    TAILOR: UI_LABELS.TAILOR,
    CLIENT: UI_LABELS.CLIENT,
    MANAGER: 'Studio Manager',
    SENIOR: 'Senior Designer',
    WORKER: 'Fashion Artisan',
    APPRENTICE: 'Apprentice',
};

export const UI_MESSAGES = {
    FIND_TAILOR: `Find Your ${UI_LABELS.TAILOR}`,
    TAILOR_PROFILE: `${UI_LABELS.TAILOR} Profile`,
    CONTACT_TAILOR: `Contact ${UI_LABELS.TAILOR}`,
};
