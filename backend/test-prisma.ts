import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

console.log('DATABASE_URL:', process.env.DATABASE_URL);

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

async function main() {
    try {
        console.log('Connecting to database...');
        await prisma.$connect();
        console.log('Database connection successful!');
        const userCount = await prisma.user.count();
        console.log('User count:', userCount);
    } catch (error) {
        console.error('Database connection failed:');
        console.error(error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
