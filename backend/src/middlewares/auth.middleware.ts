import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { adminAuth } from '../lib/firebase-admin';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
    };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Skip auth check for testing if environment variable is set
    if (process.env.SKIP_AUTH === 'true') {
        req.user = {
            id: 'mock-user-id',
            email: 'mock@example.com'
        };
        return next();
    }

    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const token = authHeader.split(' ')[1];
        let decodedToken;

        try {
            decodedToken = await adminAuth.verifyIdToken(token);
        } catch (error) {
            console.error('Firebase token verification failed:', error);
            return res.status(401).json({ message: 'Invalid or expired token' });
        }

        const { uid, email, name, picture } = decodedToken;

        // Try to find user or create if they don't exist
        let user = await prisma.user.findUnique({
            where: { id: uid },
            select: { id: true, email: true }
        });

        if (!user) {
            // Check by email in case of existing accounts being linked
            user = await prisma.user.findUnique({
                where: { email: email },
                select: { id: true, email: true }
            });

            if (user) {
                // Link account by updating ID to Firebase UID if possible
                // Note: This is risky if dependencies exist, but cleaner for UID consistency
                await prisma.user.update({
                    where: { email: email },
                    data: { id: uid }
                });
            } else {
                // Create new user
                user = await prisma.user.create({
                    data: {
                        id: uid,
                        email: email || '',
                        name: (name as string) || 'User',
                        avatar: picture as string
                    } as any,
                    select: { id: true, email: true }
                });
            }
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({ message: 'Internal server error during authentication' });
    }
};
