/**
 * Centralized hooks export
 * Import all hooks from '@/hooks'
 */

// CSRF Protection
export { useCsrf } from './use-csrf';

// API Data Fetching (generic hooks)
export {
    // Dashboard
    useDashboardStats,
    // Orders
    useOrders,
    useOrder,
    // Clients
    useClients,
    useClient,
    // Profile
    useProfile,
    useUpdateProfile,
    // Notifications
    useNotifications,
    useMarkNotificationRead,
    // Appointments
    useAppointments,
    // Inventory
    useInventory,
    // Payments
    usePayments,
    // Generic
    useDelete,
} from './use-api';

// Offline Sync
export { useOfflineSync } from './use-offline-sync';

// Measurement Draft
export { useMeasurementDraft } from './use-measurement-draft';

// Portfolio (has more complete implementation with mutations)
export {
    usePortfolio,
    usePortfolioMutation,
    useGlobalGallery,
    useDiscover
} from './use-portfolio-cache';
