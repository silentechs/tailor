import Dexie, { type Table } from 'dexie';

export interface OfflineMeasurement {
    id?: number;
    clientSideId: string;
    clientId: string;
    templateId?: string | null;
    values: any;
    notes?: string | null;
    sketch?: string | null;
    isSynced: boolean;
    error?: string | null;
    createdAt: number;
    updatedAt: number;
}

export class StitchCraftOfflineDB extends Dexie {
    measurements!: Table<OfflineMeasurement>;

    constructor() {
        super('StitchCraftOfflineDB');
        this.version(1).stores({
            measurements: '++id, clientSideId, clientId, isSynced, createdAt'
        });
    }

    async saveMeasurement(measurement: Omit<OfflineMeasurement, 'id' | 'isSynced' | 'createdAt' | 'updatedAt'>) {
        const now = Date.now();
        return await this.measurements.add({
            ...measurement,
            isSynced: false,
            createdAt: now,
            updatedAt: now,
        });
    }

    async getDraftForClient(clientId: string) {
        return await this.measurements
            .where('clientId')
            .equals(clientId)
            .and(m => !m.isSynced)
            .first();
    }

    async markAsSynced(clientSideId: string) {
        return await this.measurements
            .where('clientSideId')
            .equals(clientSideId)
            .modify({ isSynced: true });
    }

    async clearClientDrafts(clientId: string) {
        const drafts = await this.measurements
            .where('clientId')
            .equals(clientId)
            .and(m => !m.isSynced)
            .toArray();

        for (const d of drafts) {
            if (d.id) await this.measurements.delete(d.id);
        }
    }

    async getUnsynced() {
        return await this.measurements.where('isSynced').equals(0).toArray(); // Dexie boolean is 0/1
    }
}

export const offlineDb = new StitchCraftOfflineDB();
