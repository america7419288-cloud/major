import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { socketService } from '../socket';

export class NotificationController {
    static async getNotifications(req: Request, res: Response) {
        try {
            if (process.env.SKIP_AUTH === 'true') {
                return res.json([]);
            }
            const userId = (req as any).user.id;
            const notifications = await prisma.notification.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 50
            });
            res.json(notifications);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    static async markAsRead(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const userId = (req as any).user.id;

            const notification = await prisma.notification.findFirst({
                where: { id: id as string, userId: userId as string }
            });

            if (!notification) {
                return res.status(404).json({ message: 'Notification not found' });
            }

            const updated = await prisma.notification.update({
                where: { id: id as string },
                data: { isRead: true }
            });

            res.json(updated);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    static async markAllAsRead(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;

            await prisma.notification.updateMany({
                where: { userId, isRead: false },
                data: { isRead: true }
            });

            res.json({ message: 'All notifications marked as read' });
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    static async deleteNotification(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const userId = (req as any).user.id;

            const notification = await prisma.notification.findFirst({
                where: { id: id as string, userId: userId as string }
            });

            if (!notification) {
                return res.status(404).json({ message: 'Notification not found' });
            }

            await prisma.notification.delete({
                where: { id: id as string }
            });

            res.json({ message: 'Notification deleted' });
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    // Utility method to create notifications internally
    static async createNotification(data: {
        userId: string;
        type: string;
        title: string;
        content: string;
        link?: string;
    }) {
        try {
            const notification = await prisma.notification.create({
                data: {
                    userId: data.userId,
                    type: data.type,
                    title: data.title,
                    content: data.content,
                    link: data.link || null,
                }
            });
            
            socketService.emitNotification(data.userId, notification);
            
            return notification;
        } catch (error) {
            console.error('Failed to create notification:', error);
        }
    }
}
