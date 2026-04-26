"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteComment = exports.updateComment = exports.resolveComment = exports.getComments = exports.createComment = void 0;
const prisma_1 = require("../lib/prisma");
const NotificationController_1 = require("./NotificationController");
const createComment = async (req, res) => {
    try {
        const { entityType, entityId, content, parentId, anchorText, blockSnapshot } = req.body;
        const userId = req.user.id;
        if (!entityType || !entityId || !content) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        const comment = await prisma_1.prisma.comment.create({
            data: {
                entityType: entityType,
                entityId: entityId,
                content: content,
                parentId: parentId || null,
                userId: userId,
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
            prisma_1.prisma.comment.findUnique({
                where: { id: parentId },
                select: { userId: true, content: true }
            }).then(parentComment => {
                if (parentComment && parentComment.userId !== userId) {
                    NotificationController_1.NotificationController.createNotification({
                        userId: parentComment.userId,
                        type: 'COMMENT_REPLY',
                        title: 'New reply to your comment',
                        content: `${comment.user.name} replied: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
                        link: entityType === 'PAGE' ? `/pages/${entityId}` : undefined
                    });
                }
            });
        }
    }
    catch (error) {
        console.error('Create comment error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createComment = createComment;
const getComments = async (req, res) => {
    try {
        const { entityType, entityId } = req.query;
        if (!entityType || !entityId) {
            return res.status(400).json({ message: 'Missing entityType or entityId' });
        }
        const comments = await prisma_1.prisma.comment.findMany({
            where: {
                entityType: entityType,
                entityId: entityId,
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
    }
    catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getComments = getComments;
const resolveComment = async (req, res) => {
    try {
        const id = req.params.id;
        const userId = req.user.id;
        const comment = await prisma_1.prisma.comment.findUnique({
            where: { id },
        });
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }
        const updatedComment = await prisma_1.prisma.comment.update({
            where: { id },
            data: {
                resolvedAt: comment.resolvedAt ? null : new Date(),
            },
        });
        res.json(updatedComment);
    }
    catch (error) {
        console.error('Resolve comment error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.resolveComment = resolveComment;
const updateComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const userId = req.user.id;
        const comment = await prisma_1.prisma.comment.findUnique({
            where: { id: id },
        });
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }
        if (comment.userId !== userId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        const updatedComment = await prisma_1.prisma.comment.update({
            where: { id: id },
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
    }
    catch (error) {
        console.error('Update comment error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateComment = updateComment;
const deleteComment = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const comment = await prisma_1.prisma.comment.findUnique({
            where: { id: id },
        });
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }
        if (comment.userId !== userId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        await prisma_1.prisma.comment.delete({
            where: { id: id },
        });
        res.status(204).send();
    }
    catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.deleteComment = deleteComment;
