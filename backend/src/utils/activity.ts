import { prisma } from '../lib/prisma';

export const logActivity = async (
    userId: string,
    entityType: string,
    entityId: string,
    action: string,
    details?: any
) => {
    try {
        await prisma.activity.create({
            data: {
                userId,
                entityType,
                entityId,
                action,
                details: details ? details : undefined,
            },
        });
    } catch (error) {
        console.error('Failed to log activity:', error);
    }
};
