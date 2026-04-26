import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { PermissionLevel } from '@prisma/client';

export const checkPagePermission = (requiredLevel: PermissionLevel) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const id = req.params.id as string;
            const userId = req.user?.id;

            if (!userId) return res.status(401).json({ message: 'Unauthorized' });

            const page = await prisma.page.findUnique({
                where: { id },
                include: {
                    workspace: {
                        include: {
                            members: {
                                where: { userId }
                            }
                        }
                    },
                    permissions: {
                        where: { userId }
                    }
                }
            }) as any;

            if (!page) return res.status(404).json({ message: 'Page not found' });

            // 0. Check if user is the page owner/creator
            if (page.createdById === userId) {
                return next();
            }

            // 1. Check workspace membership (Owner/Admin have full access)
            const workspaceMember = page.workspace.members[0];
            if (workspaceMember && (workspaceMember.role === 'OWNER' || workspaceMember.role === 'ADMIN')) {
                return next();
            }

            // 2. Check granular page permissions
            const pagePermission = page.permissions[0];
            const permissionLevels: Record<string, number> = {
                'FULL_ACCESS': 4,
                'CAN_EDIT': 3,
                'CAN_COMMENT': 2,
                'CAN_VIEW': 1
            };

            const userLevel = pagePermission ? permissionLevels[pagePermission.level] : 0;
            const requiredLevelValue = permissionLevels[requiredLevel];

            if (userLevel >= requiredLevelValue) {
                return next();
            }

            // 3. Check public permission if page is public
            if (page.isPublic) {
                const publicLevel = permissionLevels[page.publicPermission];
                if (publicLevel >= requiredLevelValue) {
                    return next();
                }
            }

            // 4. Default to workspace member role if no specific page permission
            if (workspaceMember) {
                // Regular members can view by default, maybe edit if it's a collaborative workspace
                // For now, let's say members can edit if no specific restriction
                return next();
            }

            return res.status(403).json({ message: 'Forbidden' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    };
};

export const createPage = async (req: AuthRequest, res: Response) => {
    try {
        const { title, content, workspaceId, parentId, icon, coverImage } = req.body;
        const userId = req.user?.id;

        if (process.env.SKIP_AUTH === 'true') {
            return res.status(201).json({
                data: {
                    id: 'mock-page-id-' + Date.now(),
                    title: title || 'Untitled Page',
                    content: content || '[]',
                    workspaceId,
                    parentId,
                    createdById: 'mock-user-id',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            });
        }

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });
        if (!workspaceId) return res.status(400).json({ message: 'Workspace ID is required' });

        // Verify workspace access
        const workspace = await prisma.workspace.findFirst({
            where: { id: workspaceId, members: { some: { userId } } },
        });

        if (!workspace) return res.status(404).json({ message: 'Workspace not found or unauthorized' });

        // Ensure title is present or use a default
        const pageTitle = title || 'Untitled Page';

        const page = await prisma.page.create({
            data: {
                title: pageTitle,
                content: content || '[]',
                icon,
                coverImage,
                workspaceId,
                parentId,
                createdById: userId,
                position: Date.now(),
            },
        });

        return res.status(201).json({ data: page });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const getPages = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { workspaceId, parentId } = req.query;

        if (process.env.SKIP_AUTH === 'true') {
            return res.status(200).json({
                data: [
                    { id: 'mock-page-1', title: 'Welcome to JSMentor', workspaceId: workspaceId as string },
                    { id: 'mock-page-2', title: 'Getting Started', workspaceId: workspaceId as string }
                ]
            });
        }

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });
        if (!workspaceId) return res.status(400).json({ message: 'Workspace ID is required' });

        const workspace = await prisma.workspace.findFirst({
            where: { id: workspaceId as string, members: { some: { userId } } },
        });

        if (!workspace) return res.status(404).json({ message: 'Workspace not found or unauthorized' });

        const queryParentId = parentId === 'null' ? null : (parentId as string | undefined);

        const pages = await prisma.page.findMany({
            where: {
                workspaceId: workspaceId as string,
                parentId: queryParentId,
            },
            include: {
                _count: {
                    select: { permissions: true }
                }
            },
            orderBy: { createdAt: 'asc' },
        });

        return res.status(200).json({ data: pages });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const getPageById = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        if (process.env.SKIP_AUTH === 'true') {
            return res.status(200).json({
                data: {
                    id: id as string,
                    title: 'Mock Page',
                    content: '<h1>Mock Content</h1>',
                    workspaceId: 'mock-workspace-id',
                    createdById: 'mock-user-id',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    workspace: { name: 'Mock Workspace', members: [{ userId: 'mock-user-id' }] }
                }
            });
        }

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const page = await prisma.page.findUnique({
            where: { id: id as string },
            include: {
                workspace: {
                    include: {
                        members: {
                            where: { userId }
                        }
                    }
                },
                permissions: {
                    where: { userId }
                },
                _count: {
                    select: { permissions: true }
                },
                children: true, // Fetch immediate children
            }
        });

        if (!page) return res.status(404).json({ message: 'Page not found' });

        return res.status(200).json({ data: page });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const updatePage = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const { title, content, icon, coverImage, fontStyle, isFullWidth, isSmallText } = req.body;
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const page = await prisma.page.findUnique({
            where: { id: id as string },
            include: { workspace: { include: { members: { where: { userId } } } } }
        });

        if (!page) return res.status(404).json({ message: 'Page not found' });

        const updatedPage = await prisma.page.update({
            where: { id: id as string },
            data: { 
                title, 
                content, 
                icon, 
                coverImage,
                fontStyle,
                isFullWidth,
                isSmallText,
                updatedById: userId
            }
        });

        // Create a version snapshot if content changed
        if (content) {
            const lastVersion = await prisma.pageVersion.findFirst({
                where: { pageId: id, createdById: userId },
                orderBy: { createdAt: 'desc' }
            });

            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

            if (!lastVersion || lastVersion.createdAt < fiveMinutesAgo) {
                await prisma.pageVersion.create({
                    data: {
                        pageId: id,
                        content: typeof content === 'string' ? JSON.parse(content) : content,
                        title: title || page.title,
                        createdById: userId,
                        changeDescription: 'Auto-save'
                    }
                });
            }
        }

        return res.status(200).json({ data: updatedPage });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const getPageVersions = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const versions = await prisma.pageVersion.findMany({
            where: { pageId: id },
            orderBy: { createdAt: 'desc' },
            include: {
                createdBy: {
                    select: { id: true, name: true, avatar: true }
                }
            }
        });
        return res.status(200).json({ data: versions });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const getPageVersionById = async (req: AuthRequest, res: Response) => {
    try {
        const versionId = req.params.versionId as string;
        const version = await prisma.pageVersion.findUnique({
            where: { id: versionId },
            include: {
                createdBy: {
                    select: { id: true, name: true, avatar: true }
                }
            }
        });
        if (!version) return res.status(404).json({ message: 'Version not found' });
        return res.status(200).json({ data: version });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const restorePageVersion = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const versionId = req.params.versionId as string;
        const version = await prisma.pageVersion.findUnique({
            where: { id: versionId }
        });

        if (!version || version.pageId !== id) {
            return res.status(404).json({ message: 'Version not found' });
        }

        const updatedPage = await prisma.page.update({
            where: { id },
            data: {
                content: version.content as any,
                title: version.title,
                updatedAt: new Date()
            }
        });

        return res.status(200).json({ data: updatedPage });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const deletePage = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const page = await prisma.page.findUnique({
            where: { id: id as string },
            include: { workspace: { include: { members: { where: { userId, role: { in: ['OWNER', 'ADMIN', 'MEMBER'] } } } } } }
        });

        if (!page) return res.status(404).json({ message: 'Page not found' });

        await prisma.page.delete({ where: { id: id as string } });

        return res.status(200).json({ message: 'Page deleted successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const sharePage = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const { email, level = 'CAN_VIEW' } = req.body;
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });
        if (!email) return res.status(400).json({ message: 'Email is required' });

        // 1. Find user by email
        const targetUser = await prisma.user.findUnique({
            where: { email }
        });

        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (targetUser.id === userId) {
            return res.status(400).json({ message: 'You cannot share a page with yourself' });
        }

        // 2. Check if permission already exists
        const existingPermission = await prisma.pagePermission.findUnique({
            where: {
                pageId_userId: {
                    pageId: id,
                    userId: targetUser.id
                }
            }
        });

        if (existingPermission) {
            const updatedPermission = await prisma.pagePermission.update({
                where: { id: existingPermission.id },
                data: { level: level as any }
            });
            return res.status(200).json({ data: updatedPermission });
        }

        // 3. Create new permission
        const permission = await prisma.pagePermission.create({
            data: {
                pageId: id,
                userId: targetUser.id,
                level: level as any,
                grantedById: userId
            }
        });

        return res.status(201).json({ data: permission });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const getPagePermissions = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const permissions = await prisma.pagePermission.findMany({
            where: { pageId: id },
            include: {
                user: {
                    select: { id: true, name: true, email: true, avatar: true }
                }
            }
        });
        return res.status(200).json({ data: permissions });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const removePagePermission = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const permissionId = req.params.permissionId as string;
        await prisma.pagePermission.delete({
            where: { id: permissionId, pageId: id }
        });
        return res.status(200).json({ message: 'Permission removed' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
