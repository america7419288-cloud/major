import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error('DATABASE_URL is not defined in the environment variables.');
    process.exit(1);
}

// Create a connection pool from your environment variable
const pool = new Pool({
    connectionString: databaseUrl,
    // Add some basic pooling settings for stability
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000, // 10 seconds for neon cold starts
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});

const adapter = new PrismaPg(pool);

// Provide the adapter to the PrismaClient constructor
// @ts-ignore
export const prisma = new PrismaClient({
    adapter,
    log: ['query', 'info', 'warn', 'error'],
} as any);

export default prisma;
