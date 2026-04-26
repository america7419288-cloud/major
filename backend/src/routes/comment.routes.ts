import { Router } from 'express';
import { createComment, getComments, updateComment, deleteComment, resolveComment } from '../controllers/comment.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', createComment);
router.get('/', getComments);
router.patch('/:id', updateComment);
router.patch('/:id/resolve', resolveComment);
router.delete('/:id', deleteComment);

export default router;
