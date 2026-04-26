import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Workspace, UIState } from '@/types';
export * from './task.store';
export * from './database.store';
export * from './presence.store';
export * from './workspace.store';
export * from './page.store';
export * from './notification.store';

// ─── Auth Store ──────────────────────────────────────────────────────────────
interface AuthStore {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    loading: boolean;
    setAuth: (user: User, accessToken: string, refreshToken: string) => void;
    clearAuth: () => void;
    updateUser: (user: Partial<User>) => void;
    setLoading: (loading: boolean) => void;
}

const SHOULD_SKIP_AUTH = import.meta.env.VITE_SKIP_AUTH === 'true';
const MOCK_USER = {
    id: 'mock-user-id',
    name: 'Mock User',
    email: 'mock@example.com',
    avatar: 'https://ui-avatars.com/api/?name=Mock+User&background=6366f1&color=fff'
};

export const useAuthStore = create<AuthStore>()(
    persist(
        (set) => ({
            user: SHOULD_SKIP_AUTH ? MOCK_USER as any : null,
            accessToken: SHOULD_SKIP_AUTH ? 'mock-access-token' : null,
            refreshToken: SHOULD_SKIP_AUTH ? 'mock-refresh-token' : null,
            loading: !SHOULD_SKIP_AUTH,
            setAuth: (user, accessToken, refreshToken) => set({ user, accessToken, refreshToken, loading: false }),
            clearAuth: () => set({ user: null, accessToken: null, refreshToken: null, loading: false }),
            updateUser: (data) => set((s) => ({ user: s.user ? { ...s.user, ...data } : null })),
            setLoading: (loading) => set({ loading }),
        }),
        {
            name: 'auth-storage',
            merge: (persistedState: any, currentState) => {
                if (SHOULD_SKIP_AUTH) {
                    return {
                        ...currentState,
                        user: MOCK_USER as any,
                        accessToken: 'mock-access-token',
                        refreshToken: 'mock-refresh-token',
                        loading: false,
                    };
                }
                return { ...currentState, ...persistedState };
            }
        }
    )
);

// ─── UI Store ─────────────────────────────────────────────────────────────────
interface UIStore extends UIState {
    setSidebarCollapsed: (v: boolean) => void;
    toggleSidebar: () => void;
    setTheme: (t: UIState['theme']) => void;
    setActiveWorkspace: (id: string | null) => void;
    toggleCommandPalette: () => void;
    setCommandPaletteOpen: (v: boolean) => void;
    toggleRightPanel: () => void;
    inboxOpen: boolean;
    toggleInbox: () => void;
    setInboxOpen: (v: boolean) => void;
}

export const useUIStore = create<UIStore>()(
    persist(
        (set) => ({
            sidebarCollapsed: false,
            theme: 'dark',
            activeWorkspaceId: null,
            commandPaletteOpen: false,
            rightPanelOpen: false,
            setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
            toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
            setTheme: (theme) => set({ theme }),
            setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),
            toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
            setCommandPaletteOpen: (v) => set({ commandPaletteOpen: v }),
            toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),
            inboxOpen: false,
            toggleInbox: () => set((s) => ({ inboxOpen: !s.inboxOpen })),
            setInboxOpen: (v) => set({ inboxOpen: v }),
        }),
        { name: 'ui-storage', partialize: (s) => ({ theme: s.theme, sidebarCollapsed: s.sidebarCollapsed, activeWorkspaceId: s.activeWorkspaceId }) }
    )
);

// ─── Workspace Store ──────────────────────────────────────────────────────────
// Workspace store has been moved to workspace.store.ts
