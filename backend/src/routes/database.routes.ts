import { Router } from 'express';
import {
    createDatabase, getDatabases, getDatabaseById, updateDatabase, deleteDatabase,
    createDatabaseItem, updateDatabaseItem, deleteDatabaseItem,
    createDatabaseView, updateDatabaseView, deleteDatabaseView
} from '../controllers/database.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

// Database routes
router.post('/', createDatabase);
router.get('/', getDatabases);
router.get('/:id', getDatabaseById);
router.patch('/:id', updateDatabase);
router.delete('/:id', deleteDatabase);

// Item routes
router.post('/items', createDatabaseItem);
router.patch('/items/:id', updateDatabaseItem);
router.delete('/items/:id', deleteDatabaseItem);

// View routes
router.post('/views', createDatabaseView);
router.patch('/views/:id', updateDatabaseView);
router.delete('/views/:id', deleteDatabaseView);

export default router;
