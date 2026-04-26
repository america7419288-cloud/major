import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, NotificationController.getNotifications);
router.patch('/read-all', authenticate, NotificationController.markAllAsRead);
router.patch('/:id/read', authenticate, NotificationController.markAsRead);
router.delete('/:id', authenticate, NotificationController.deleteNotification);

export default router;
