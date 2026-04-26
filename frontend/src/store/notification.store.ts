import { create } from 'zustand';
import { notificationApi, Notification } from '../api/notifications';
import { usePresenceStore } from './presence.store';

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    error: string | null;
    
    fetchNotifications: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
    
    // Socket real-time update handler
    addNotification: (notification: Notification) => void;
    
    // Initialize socket listeners
    initSocketListeners: () => void;
    cleanupSocketListeners: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,

    fetchNotifications: async () => {
        set({ isLoading: true, error: null });
        try {
            const notifications = await notificationApi.getNotifications();
            set({ 
                notifications,
                unreadCount: notifications.filter(n => !n.isRead).length,
                isLoading: false 
            });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    markAsRead: async (id: string) => {
        try {
            const updated = await notificationApi.markAsRead(id);
            const { notifications } = get();
            const newNotifications = notifications.map(n => n.id === id ? { ...n, isRead: updated.isRead } : n);
            set({ 
                notifications: newNotifications,
                unreadCount: newNotifications.filter(n => !n.isRead).length
            });
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    },

    markAllAsRead: async () => {
        try {
            await notificationApi.markAllAsRead();
            const { notifications } = get();
            const newNotifications = notifications.map(n => ({ ...n, isRead: true }));
            set({ 
                notifications: newNotifications,
                unreadCount: 0
            });
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    },

    deleteNotification: async (id: string) => {
        try {
            await notificationApi.deleteNotification(id);
            const { notifications } = get();
            const newNotifications = notifications.filter(n => n.id !== id);
            set({ 
                notifications: newNotifications,
                unreadCount: newNotifications.filter(n => !n.isRead).length
            });
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    },

    addNotification: (notification: Notification) => {
        const { notifications } = get();
        // Prevent duplicates
        if (!notifications.find(n => n.id === notification.id)) {
            const newNotifications = [notification, ...notifications];
            set({ 
                notifications: newNotifications,
                unreadCount: newNotifications.filter(n => !n.isRead).length
            });
        }
    },

    initSocketListeners: () => {
        const { socket } = usePresenceStore.getState();
        if (socket) {
            socket.on('notification', (notification: Notification) => {
                get().addNotification(notification);
            });
        }
    },

    cleanupSocketListeners: () => {
        const { socket } = usePresenceStore.getState();
        if (socket) {
            socket.off('notification');
        }
    }
}));
