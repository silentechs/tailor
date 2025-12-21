import type { WorkerRole } from '@prisma/client';

// Permission definitions
export const PERMISSIONS = {
    // Orders
    'orders:read': 'View orders',
    'orders:write': 'Create/edit orders',
    'orders:delete': 'Delete orders',

    // Tasks
    'tasks:read': 'View tasks',
    'tasks:write': 'Create/complete tasks',
    'tasks:assign': 'Assign tasks to workers',

    // Clients
    'clients:read': 'View clients',
    'clients:write': 'Manage clients',

    // Inventory
    'inventory:read': 'View inventory',
    'inventory:write': 'Manage inventory',

    // Financials (RESTRICTED)
    'payments:read': 'View payments',
    'payments:write': 'Record payments',
    'invoices:read': 'View invoices',
    'invoices:write': 'Create invoices',

    // Settings (RESTRICTED)
    'settings:read': 'View settings',
    'settings:write': 'Manage settings',
    'workers:manage': 'Invite/manage workers',
} as const;

export type Permission = keyof typeof PERMISSIONS;

// Role → Default Permissions mapping
export const ROLE_PERMISSIONS: Record<WorkerRole, Permission[]> = {
    MANAGER: Object.keys(PERMISSIONS) as Permission[],
    SENIOR: [
        'orders:read', 'orders:write',
        'tasks:read', 'tasks:write', 'tasks:assign',
        'clients:read', 'clients:write',
        'inventory:read', 'inventory:write',
        'payments:read', 'invoices:read',
    ],
    WORKER: [
        'orders:read',
        'tasks:read', 'tasks:write',
        'clients:read',
        'inventory:read',
    ],
    APPRENTICE: [
        'orders:read',
        'tasks:read',
        'clients:read',
    ],
};
