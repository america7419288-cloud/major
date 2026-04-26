"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const firebase_admin_1 = __importDefault(require("../lib/firebase-admin"));
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    try {
        // Verify database connection
        await prisma_1.prisma.$queryRaw `SELECT 1`;
        // Verify Firebase Admin SDK
        const isFirebaseInitialized = firebase_admin_1.default.apps.length > 0;
        if (!isFirebaseInitialized) {
            throw new Error('Firebase Admin SDK is not initialized');
        }
        res.status(200).json({
            status: 'healthy',
            database: 'connected',
            firebase: 'initialized'
        });
    }
    catch (error) {
        console.error('Health check failed:', error);
        res.status(503).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});
exports.default = router;
