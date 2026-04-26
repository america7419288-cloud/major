import { Router } from 'express';
import { 
    createPage, 
    getPages, 
    getPageById, 
    updatePage, 
    deletePage,
    getPageVersions,
    getPageVersionById,
    restorePageVersion,
    checkPagePermission,
    sharePage,
    getPagePermissions,
    removePagePermission
} from '../controllers/page.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', createPage);
router.get('/', getPages);
router.get('/:id', checkPagePermission('CAN_VIEW'), getPageById);
router.put('/:id', checkPagePermission('CAN_EDIT'), updatePage);
router.delete('/:id', checkPagePermission('FULL_ACCESS'), deletePage);

// Version history
router.get('/:id/versions', checkPagePermission('CAN_VIEW'), getPageVersions);
router.get('/:id/versions/:versionId', checkPagePermission('CAN_VIEW'), getPageVersionById);
router.post('/:id/restore/:versionId', checkPagePermission('CAN_EDIT'), restorePageVersion);

// Permissions & Sharing
router.post('/:id/share', checkPagePermission('FULL_ACCESS'), sharePage);
router.get('/:id/permissions', checkPagePermission('FULL_ACCESS'), getPagePermissions);
router.delete('/:id/permissions/:permissionId', checkPagePermission('FULL_ACCESS'), removePagePermission);

export default router;
