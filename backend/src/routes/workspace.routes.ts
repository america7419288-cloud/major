import { Router } from 'express';
import { createWorkspace, getWorkspaces, getWorkspaceById, updateWorkspace, deleteWorkspace, addWorkspaceMember, updateMemberRole, removeWorkspaceMember } from '../controllers/workspace.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', createWorkspace);
router.get('/', getWorkspaces);
router.get('/:id', getWorkspaceById);
router.put('/:id', updateWorkspace);
router.delete('/:id', deleteWorkspace);

// Member management
router.post('/:id/members', addWorkspaceMember);
router.patch('/:id/members/:memberId', updateMemberRole);
router.delete('/:id/members/:memberId', removeWorkspaceMember);

export default router;
