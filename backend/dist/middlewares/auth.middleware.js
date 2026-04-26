"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const prisma_1 = require("../lib/prisma");
const firebase_admin_1 = require("../lib/firebase-admin");
const authenticate = async (req, res, next) => {
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
            decodedToken = await firebase_admin_1.adminAuth.verifyIdToken(token);
        }
        catch (error) {
            console.error('Firebase token verification failed:', error);
            return res.status(401).json({ message: 'Invalid or expired token' });
        }
        const { uid, email, name, picture } = decodedToken;
        // Try to find user or create if they don't exist
        let user = await prisma_1.prisma.user.findUnique({
            where: { id: uid },
            select: { id: true, email: true }
        });
        if (!user) {
            // Check by email in case of existing accounts being linked
            user = await prisma_1.prisma.user.findUnique({
                where: { email: email },
                select: { id: true, email: true }
            });
            if (user) {
                // Link account by updating ID to Firebase UID if possible
                // Note: This is risky if dependencies exist, but cleaner for UID consistency
                await prisma_1.prisma.user.update({
                    where: { email: email },
                    data: { id: uid }
                });
            }
            else {
                // Create new user
                user = await prisma_1.prisma.user.create({
                    data: {
                        id: uid,
                        email: email || '',
                        name: name || 'User',
                        avatar: picture
                    },
                    select: { id: true, email: true }
                });
            }
        }
        req.user = user;
        next();
    }
    catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({ message: 'Internal server error during authentication' });
    }
};
exports.authenticate = authenticate;
