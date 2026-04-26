import api from '../lib/api';

export interface Notification {
    id: string;
    userId: string;
    type: string;
    title: string;
    content: string;
    link?: string;
    isRead: boolean;
    createdAt: string;
}

export const notificationApi = {
    getNotifications: async (): Promise<Notification[]> => {
        const response = await api.get('/notifications');
        return response.data;
    },

    markAsRead: async (id: string): Promise<Notification> => {
        const response = await api.patch(`/notifications/${id}/read`);
        return response.data;
    },

    markAllAsRead: async (): Promise<{ message: string }> => {
        const response = await api.patch('/notifications/read-all');
        return response.data;
    },

    deleteNotification: async (id: string): Promise<{ message: string }> => {
        const response = await api.delete(`/notifications/${id}`);
        return response.data;
    }
};
