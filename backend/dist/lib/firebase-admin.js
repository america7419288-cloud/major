"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAuth = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;
if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && privateKey) {
    firebase_admin_1.default.initializeApp({
        credential: firebase_admin_1.default.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey,
        }),
    });
    console.log('Firebase Admin initialized');
}
else {
    console.warn('Firebase Admin not initialized: Missing environment variables');
}
exports.adminAuth = firebase_admin_1.default.auth();
exports.default = firebase_admin_1.default;
