import { Router } from 'express';
import { createTask, getTasks, getTaskById, updateTask, deleteTask, moveTask, copyTaskToWorkspace } from '../controllers/task.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', createTask);
router.get('/', getTasks);
router.get('/:id', getTaskById);
router.put('/:id', updateTask);
router.post('/:id/move', moveTask);
router.post('/:id/copy', copyTaskToWorkspace);
router.delete('/:id', deleteTask);

export default router;
