import { Router } from 'express';
import { prisma } from '../lib/prisma';
import admin from '../lib/firebase-admin';

const router = Router();

router.get('/', async (req, res) => {
    try {
        // Verify database connection
        await prisma.$queryRaw`SELECT 1`;

        // Verify Firebase Admin SDK
        const isFirebaseInitialized = admin.apps.length > 0;
        if (!isFirebaseInitialized) {
            throw new Error('Firebase Admin SDK is not initialized');
        }

        res.status(200).json({
            status: 'healthy',
            database: 'connected',
            firebase: 'initialized'
        });
    } catch (error: any) {
        console.error('Health check failed:', error);
        res.status(503).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});

export default router;
