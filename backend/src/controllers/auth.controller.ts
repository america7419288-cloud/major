import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { generateToken } from '../lib/jwt';
import { AuthRequest } from '../middlewares/auth.middleware';

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, name } = req.body;

        // Validate
        if (!email || !password || !name) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
            },
        } as any);

        const token = generateToken({ userId: user.id });

        return res.status(201).json({
            data: {
                user: { id: user.id, email: user.email, name: user.name },
                accessToken: token,
            },
            message: 'User registered successfully',
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (!user.password) {
            return res.status(401).json({ message: 'This account uses a different login method. Please use Google or your provider.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = generateToken({ userId: user.id });

        return res.status(200).json({
            data: {
                user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar },
                accessToken: token,
            },
            message: 'Login successful',
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const getMe = async (req: AuthRequest, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user?.id },
            select: { id: true, email: true, name: true, avatar: true, bio: true, createdAt: true },
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({ data: user });
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const searchUsers = async (req: Request, res: Response) => {
    try {
        const { query } = req.query;
        if (!query || typeof query !== 'string') {
            return res.status(400).json({ message: 'Missing search query' });
        }

        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { name: { contains: query } },
                    { email: { contains: query } },
                ],
                NOT: { id: (req as any).user?.id } // Don't include self
            },
            select: { id: true, name: true, email: true, avatar: true },
            take: 10,
        });

        return res.status(200).json({ data: users });
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { name, avatar, bio } = req.body;

        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                name,
                avatar,
                bio,
            },
            select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                bio: true,
                createdAt: true,
            },
        });

        return res.status(200).json({ data: user });
    } catch (error) {
        console.error('Update profile error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
