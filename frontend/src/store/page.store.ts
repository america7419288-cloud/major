import { create } from 'zustand';
import { Page } from '@/types';
import { api } from '@/lib/axios';
import { toast } from 'sonner';

export interface PageTreeNode extends Page {
    children: PageTreeNode[];
}

interface PageStore {
    pages: Page[];
    tree: PageTreeNode[];
    activePageId: string | null;
    loading: boolean;
    error: string | null;
    saving: boolean;
    lastSaved: Date | null;
    
    setActivePage: (id: string | null) => void;
    fetchPages: (workspaceId: string) => Promise<void>;
    createPage: (workspaceId: string, parentId?: string | null) => Promise<string | undefined>;
    updatePage: (id: string, data: Partial<Page>) => Promise<void>;
    deletePage: (id: string) => Promise<void>;
    restoreVersion: (pageId: string, versionId: string) => Promise<void>;
    sharePage: (id: string, email: string, level?: string) => Promise<void>;
    fetchPermissions: (id: string) => Promise<any[]>;
    removePermission: (id: string, permissionId: string) => Promise<void>;
    setSaving: (saving: boolean) => void;
}

const buildTree = (pages: Page[], parentId: string | null = null): PageTreeNode[] => {
    return pages
        .filter((page) => page.parentId === parentId)
        .map((page) => ({
            ...page,
            children: buildTree(pages, page.id),
        }))
        .sort((a, b) => {
            const posA = a.position || 0;
            const posB = b.position || 0;
            return posA - posB;
        });
};

export const usePageStore = create<PageStore>((set, get) => ({
    pages: [],
    tree: [],
    activePageId: null,
    loading: false,
    error: null,
    saving: false,
    lastSaved: null,

    setActivePage: (id) => set({ activePageId: id }),
    setSaving: (saving) => set({ saving }),

    fetchPages: async (workspaceId) => {
        set({ loading: true, error: null });
        try {
            const res = await api.get(`/pages?workspaceId=${workspaceId}`);
            const pages = res.data.data || [];
            set({ 
                pages, 
                tree: buildTree(pages),
                loading: false 
            });
        } catch (error: any) {
            console.error('Failed to fetch pages:', error);
            set({ error: error.response?.data?.message || 'Failed to load pages', loading: false });
        }
    },

    createPage: async (workspaceId, parentId = null) => {
        try {
            const res = await api.post('/pages', {
                title: 'Untitled',
                content: '{"type":"doc","content":[{"type":"paragraph"}]}', // Default Tiptap empty doc
                workspaceId,
                parentId,
            });
            const newPage = res.data.data;
            const updatedPages = [...get().pages, newPage];
            set({ 
                pages: updatedPages,
                tree: buildTree(updatedPages),
                activePageId: newPage.id
            });
            return newPage.id;
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create page');
        }
    },

    updatePage: async (id, data) => {
        set({ saving: true });
        // Optimistic update
        const updatedPages = get().pages.map((p) => (p.id === id ? { ...p, ...data } : p));
        set({ 
            pages: updatedPages,
            tree: buildTree(updatedPages),
        });

        try {
            await api.put(`/pages/${id}`, data);
            set({ saving: false });
        } catch (error: any) {
            toast.error('Failed to save changes');
            set({ saving: false });
            // Should theoretically revert, but avoiding complexity here
            throw error;
        }
    },

    deletePage: async (id) => {
        try {
            await api.delete(`/pages/${id}`);
            const updatedPages = get().pages.filter((p) => p.id !== id && p.parentId !== id); // Note: Should recursively remove children locally or refetch
            set({ 
                pages: updatedPages,
                tree: buildTree(updatedPages),
                activePageId: get().activePageId === id ? null : get().activePageId
            });
            toast.success('Page deleted');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete page');
            throw error;
        }
    },

    restoreVersion: async (pageId, versionId) => {
        set({ loading: true });
        try {
            const res = await api.post(`/pages/${pageId}/restore/${versionId}`);
            const updatedPage = res.data.data;
            const updatedPages = get().pages.map(p => p.id === pageId ? updatedPage : p);
            set({
                pages: updatedPages,
                tree: buildTree(updatedPages),
                loading: false
            });
            toast.success('Version restored');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to restore version');
            set({ loading: false });
            throw error;
        }
    },

    sharePage: async (id, email, level = 'CAN_VIEW') => {
        try {
            await api.post(`/pages/${id}/share`, { email, level });
            toast.success('Page shared successfully');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to share page');
            throw error;
        }
    },

    fetchPermissions: async (id) => {
        try {
            const res = await api.get(`/pages/${id}/permissions`);
            return res.data.data;
        } catch (error: any) {
            console.error('Failed to fetch permissions:', error);
            return [];
        }
    },

    removePermission: async (id, permissionId) => {
        try {
            await api.delete(`/pages/${id}/permissions/${permissionId}`);
            toast.success('Permission removed');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to remove permission');
            throw error;
        }
    },
}));
