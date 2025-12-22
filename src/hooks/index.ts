/**
 * Centralized hooks export
 * Import all hooks from '@/hooks'
 */

// API Data Fetching (generic hooks)
export {
  // Appointments
  useAppointments,
  useClient,
  // Clients
  useClients,
  // Dashboard
  useDashboardStats,
  // Generic
  useDelete,
  // Inventory
  useInventory,
  useMarkNotificationRead,
  // Notifications
  useNotifications,
  useOrder,
  // Orders
  useOrders,
  // Payments
  usePayments,
  // Profile
  useProfile,
  useUpdateProfile,
} from './use-api';
// CSRF Protection
export { useCsrf } from './use-csrf';
// Measurement Draft
export { useMeasurementDraft } from './use-measurement-draft';
// Offline Sync
export { useOfflineSync } from './use-offline-sync';

// Portfolio (has more complete implementation with mutations)
export {
  useDiscover,
  useGlobalGallery,
  usePortfolio,
  usePortfolioMutation,
} from './use-portfolio-cache';
