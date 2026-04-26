import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { NotificationController } from './NotificationController';

export const createComment = async (req: Request, res: Response) => {
    try {
        const { entityType, entityId, content, parentId, anchorText, blockSnapshot } = req.body;
        const userId = (req as any).user.id;

        if (!entityType || !entityId || !content) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const comment = await prisma.comment.create({
            data: {
                entityType: entityType as string,
                entityId: entityId as string,
                content: content as string,
                parentId: (parentId as string) || null,
                userId: userId as string,
                anchorText: anchorText || null,
                blockSnapshot: blockSnapshot || null,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                    },
                },
            },
        });

        res.status(201).json(comment);

        // Internal notification logic (async, don't block response)
        if (parentId) {
            prisma.comment.findUnique({
                where: { id: parentId as string },
                select: { userId: true, content: true }
            }).then(parentComment => {
                if (parentComment && parentComment.userId !== userId) {
                    NotificationController.createNotification({
                        userId: parentComment.userId,
                        type: 'COMMENT_REPLY',
                        title: 'New reply to your comment',
                        content: `${comment.user.name} replied: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
                        link: entityType === 'PAGE' ? `/pages/${entityId}` : undefined
                    });
                }
            });
        }
    } catch (error) {
        console.error('Create comment error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getComments = async (req: Request, res: Response) => {
    try {
        const { entityType, entityId } = req.query;

        if (!entityType || !entityId) {
            return res.status(400).json({ message: 'Missing entityType or entityId' });
        }

        const comments = await prisma.comment.findMany({
            where: {
                entityType: entityType as string,
                entityId: entityId as string,
                parentId: null, // Get top-level comments first
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                    },
                },
                replies: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                avatar: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'asc',
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        res.json(comments);
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const resolveComment = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const userId = (req as any).user.id;

        const comment = await prisma.comment.findUnique({
            where: { id },
        });

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        const updatedComment = await prisma.comment.update({
            where: { id },
            data: {
                resolvedAt: comment.resolvedAt ? null : new Date(),
            },
        });

        res.json(updatedComment);
    } catch (error) {
        console.error('Resolve comment error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateComment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const userId = (req as any).user.id;

        const comment = await prisma.comment.findUnique({
            where: { id: id as string },
        });

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        if (comment.userId !== userId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const updatedComment = await prisma.comment.update({
            where: { id: id as string },
            data: { content },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                    },
                },
            },
        });

        res.json(updatedComment);
    } catch (error) {
        console.error('Update comment error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const deleteComment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;

        const comment = await prisma.comment.findUnique({
            where: { id: id as string },
        });

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        if (comment.userId !== userId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        await prisma.comment.delete({
            where: { id: id as string },
        });

        res.status(204).send();
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
