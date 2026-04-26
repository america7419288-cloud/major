"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const prisma_1 = require("../lib/prisma");
const socket_1 = require("../socket");
class NotificationController {
    static async getNotifications(req, res) {
        try {
            if (process.env.SKIP_AUTH === 'true') {
                return res.json([]);
            }
            const userId = req.user.id;
            const notifications = await prisma_1.prisma.notification.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 50
            });
            res.json(notifications);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    static async markAsRead(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const notification = await prisma_1.prisma.notification.findFirst({
                where: { id: id, userId: userId }
            });
            if (!notification) {
                return res.status(404).json({ message: 'Notification not found' });
            }
            const updated = await prisma_1.prisma.notification.update({
                where: { id: id },
                data: { isRead: true }
            });
            res.json(updated);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    static async markAllAsRead(req, res) {
        try {
            const userId = req.user.id;
            await prisma_1.prisma.notification.updateMany({
                where: { userId, isRead: false },
                data: { isRead: true }
            });
            res.json({ message: 'All notifications marked as read' });
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    static async deleteNotification(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const notification = await prisma_1.prisma.notification.findFirst({
                where: { id: id, userId: userId }
            });
            if (!notification) {
                return res.status(404).json({ message: 'Notification not found' });
            }
            await prisma_1.prisma.notification.delete({
                where: { id: id }
            });
            res.json({ message: 'Notification deleted' });
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    // Utility method to create notifications internally
    static async createNotification(data) {
        try {
            const notification = await prisma_1.prisma.notification.create({
                data: {
                    userId: data.userId,
                    type: data.type,
                    title: data.title,
                    content: data.content,
                    link: data.link || null,
                }
            });
            socket_1.socketService.emitNotification(data.userId, notification);
            return notification;
        }
        catch (error) {
            console.error('Failed to create notification:', error);
        }
    }
}
exports.NotificationController = NotificationController;
