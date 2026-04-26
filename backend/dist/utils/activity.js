"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logActivity = void 0;
const prisma_1 = require("../lib/prisma");
const logActivity = async (userId, entityType, entityId, action, details) => {
    try {
        await prisma_1.prisma.activity.create({
            data: {
                userId,
                entityType,
                entityId,
                action,
                details: details ? details : undefined,
            },
        });
    }
    catch (error) {
        console.error('Failed to log activity:', error);
    }
};
exports.logActivity = logActivity;
