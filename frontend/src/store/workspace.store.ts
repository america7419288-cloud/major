import { create } from 'zustand';
import { Workspace } from '@/types';
import { api } from '@/lib/axios';
import { toast } from 'sonner';

interface WorkspaceStore {
    workspaces: Workspace[];
    loading: boolean;
    error: string | null;
    fetchWorkspaces: () => Promise<void>;
    createWorkspace: (data: { name: string; description?: string; icon?: string }) => Promise<void>;
    updateWorkspace: (id: string, data: Partial<Workspace>) => Promise<void>;
    deleteWorkspace: (id: string) => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
    workspaces: [],
    loading: false,
    error: null,

    fetchWorkspaces: async () => {
        set({ loading: true, error: null });
        try {
            const res = await api.get('/workspaces');
            set({ workspaces: res.data.data || [], loading: false });
        } catch (error: any) {
            console.error('Failed to fetch workspaces:', error);
            set({ error: error.response?.data?.message || 'Failed to load workspaces', loading: false });
        }
    },

    createWorkspace: async (data) => {
        try {
            const res = await api.post('/workspaces', data);
            const newWorkspace = res.data.data;
            set((state) => ({ workspaces: [newWorkspace, ...state.workspaces] }));
            toast.success('Workspace created successfully');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create workspace');
            throw error;
        }
    },

    updateWorkspace: async (id, data) => {
        try {
            const res = await api.put(`/workspaces/${id}`, data);
            const updated = res.data.data;
            set((state) => ({
                workspaces: state.workspaces.map((w) => (w.id === id ? updated : w)),
            }));
            toast.success('Workspace updated');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update workspace');
            throw error;
        }
    },

    deleteWorkspace: async (id) => {
        try {
            await api.delete(`/workspaces/${id}`);
            set((state) => ({
                workspaces: state.workspaces.filter((w) => w.id !== id),
            }));
            toast.success('Workspace deleted');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete workspace');
            throw error;
        }
    },
}));
