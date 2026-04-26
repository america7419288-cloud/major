import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

interface UserPresence {
    userId: string;
    name: string;
    avatarUrl?: string;
}

interface PresenceState {
    socket: Socket | null;
    activeUsers: UserPresence[];
    connect: (user: { userId: string; name: string; avatarUrl?: string }) => void;
    disconnect: () => void;
    joinPage: (pageId: string, user: { userId: string; name: string; avatarUrl?: string }) => void;
    leavePage: (pageId: string, userId: string) => void;
    emitContentChange: (pageId: string, content: string) => void;
    onContentUpdate: (callback: (content: string) => void) => void;
    offContentUpdate: (callback: (content: string) => void) => void;
}

const SOCKET_URL = 'http://localhost:4000';

export const usePresenceStore = create<PresenceState>((set, get) => ({
    socket: null,
    activeUsers: [],

    connect: (user: { userId: string; name: string; avatarUrl?: string }) => {
        if (get().socket) return;

        const socket = io(SOCKET_URL, {
            withCredentials: true,
            query: { userId: user.userId },
        });

        socket.on('connect', () => {
            console.log('Connected to socket server');
        });

        socket.on('presence-update', (users: UserPresence[]) => {
            set({ activeUsers: users });
        });

        set({ socket });
    },

    disconnect: () => {
        const { socket } = get();
        if (socket) {
            socket.disconnect();
            set({ socket: null, activeUsers: [] });
        }
    },

    joinPage: (pageId: string, user: { userId: string; name: string; avatarUrl?: string }) => {
        const { socket } = get();
        if (socket) {
            socket.emit('join-page', { pageId, user });
        }
    },

    leavePage: (pageId: string, userId: string) => {
        const { socket } = get();
        if (socket) {
            socket.emit('leave-page', { pageId, userId });
            set({ activeUsers: [] });
        }
    },

    emitContentChange: (pageId: string, content: string) => {
        const { socket } = get();
        if (socket) {
            socket.emit('content-change', { pageId, content });
        }
    },

    onContentUpdate: (callback: (content: string) => void) => {
        const { socket } = get();
        if (socket) {
            socket.on('content-updated', callback);
        }
    },

    offContentUpdate: (callback: (content: string) => void) => {
        const { socket } = get();
        if (socket) {
            socket.off('content-updated', callback);
        }
    },
}));
