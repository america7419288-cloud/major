"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
// Ensure environment variables are loaded
dotenv_1.default.config();
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    console.error('DATABASE_URL is not defined in the environment variables.');
    process.exit(1);
}
// Create a connection pool from your environment variable
const pool = new pg_1.Pool({
    connectionString: databaseUrl,
    // Add some basic pooling settings for stability
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000, // 10 seconds for neon cold starts
});
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});
const adapter = new adapter_pg_1.PrismaPg(pool);
// Provide the adapter to the PrismaClient constructor
// @ts-ignore
exports.prisma = new client_1.PrismaClient({
    adapter,
    log: ['query', 'info', 'warn', 'error'],
});
exports.default = exports.prisma;
