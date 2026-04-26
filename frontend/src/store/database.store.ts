import { create } from 'zustand';
import { api } from '@/lib/axios';
import { Database, DatabaseItem, DatabaseView, ApiResponse } from '@/types';

interface DatabaseState {
    databases: Database[];
    loading: boolean;
    error: string | null;

    // Database CRUD
    fetchDatabases: (workspaceId: string) => Promise<void>;
    fetchDatabaseById: (id: string) => Promise<Database & { items: DatabaseItem[] }>;
    createDatabase: (data: Partial<Database>) => Promise<Database>;
    updateDatabase: (id: string, updates: Partial<Database>) => Promise<Database>;
    deleteDatabase: (id: string) => Promise<void>;

    // Item CRUD
    createItem: (databaseId: string, properties?: any) => Promise<DatabaseItem>;
    updateItem: (id: string, updates: Partial<DatabaseItem>) => Promise<DatabaseItem>;
    deleteItem: (id: string) => Promise<void>;

    // View CRUD
    createView: (databaseId: string, data: Partial<DatabaseView>) => Promise<DatabaseView>;
    updateView: (id: string, updates: Partial<DatabaseView>) => Promise<DatabaseView>;
    deleteView: (id: string) => Promise<void>;
}

export const useDatabaseStore = create<DatabaseState>((set, get) => ({
    databases: [],
    loading: false,
    error: null,

    fetchDatabases: async (workspaceId: string) => {
        set({ loading: true });
        try {
            const response = await api.get<ApiResponse<Database[]>>(`/databases?workspaceId=${workspaceId}`);
            set({ databases: response.data.data, loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    fetchDatabaseById: async (id: string) => {
        set({ loading: true });
        try {
            const response = await api.get<ApiResponse<Database & { items: DatabaseItem[] }>>(`/databases/${id}`);
            set({ loading: false });
            return response.data.data;
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    createDatabase: async (data) => {
        const response = await api.post<ApiResponse<Database>>('/databases', data);
        const newDb = response.data.data;
        set((state) => ({ databases: [...state.databases, newDb] }));
        return newDb;
    },

    updateDatabase: async (id, updates) => {
        const response = await api.patch<ApiResponse<Database>>(`/databases/${id}`, updates);
        const updatedDb = response.data.data;
        set((state) => ({
            databases: state.databases.map((db) => (db.id === id ? updatedDb : db))
        }));
        return updatedDb;
    },

    deleteDatabase: async (id) => {
        await api.delete(`/databases/${id}`);
        set((state) => ({
            databases: state.databases.filter((db) => db.id !== id)
        }));
    },

    createItem: async (databaseId, properties) => {
        const response = await api.post<ApiResponse<DatabaseItem>>('/databases/items', { databaseId, properties });
        return response.data.data;
    },

    updateItem: async (id, updates) => {
        const response = await api.patch<ApiResponse<DatabaseItem>>(`/databases/items/${id}`, updates);
        return response.data.data;
    },

    deleteItem: async (id) => {
        await api.delete(`/databases/items/${id}`);
    },

    createView: async (databaseId, data) => {
        const response = await api.post<ApiResponse<DatabaseView>>('/databases/views', { databaseId, ...data });
        return response.data.data;
    },

    updateView: async (id, updates) => {
        const response = await api.patch<ApiResponse<DatabaseView>>(`/databases/views/${id}`, updates);
        return response.data.data;
    },

    deleteView: async (id) => {
        await api.delete(`/databases/views/${id}`);
    }
}));
