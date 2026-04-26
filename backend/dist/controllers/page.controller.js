"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removePagePermission = exports.getPagePermissions = exports.sharePage = exports.deletePage = exports.restorePageVersion = exports.getPageVersionById = exports.getPageVersions = exports.updatePage = exports.getPageById = exports.getPages = exports.createPage = exports.checkPagePermission = void 0;
const prisma_1 = require("../lib/prisma");
const checkPagePermission = (requiredLevel) => {
    return async (req, res, next) => {
        try {
            const id = req.params.id;
            const userId = req.user?.id;
            if (!userId)
                return res.status(401).json({ message: 'Unauthorized' });
            const page = await prisma_1.prisma.page.findUnique({
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
            });
            if (!page)
                return res.status(404).json({ message: 'Page not found' });
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
            const permissionLevels = {
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
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    };
};
exports.checkPagePermission = checkPagePermission;
const createPage = async (req, res) => {
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
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        if (!workspaceId)
            return res.status(400).json({ message: 'Workspace ID is required' });
        // Verify workspace access
        const workspace = await prisma_1.prisma.workspace.findFirst({
            where: { id: workspaceId, members: { some: { userId } } },
        });
        if (!workspace)
            return res.status(404).json({ message: 'Workspace not found or unauthorized' });
        // Ensure title is present or use a default
        const pageTitle = title || 'Untitled Page';
        const page = await prisma_1.prisma.page.create({
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
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createPage = createPage;
const getPages = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { workspaceId, parentId } = req.query;
        if (process.env.SKIP_AUTH === 'true') {
            return res.status(200).json({
                data: [
                    { id: 'mock-page-1', title: 'Welcome to JSMentor', workspaceId: workspaceId },
                    { id: 'mock-page-2', title: 'Getting Started', workspaceId: workspaceId }
                ]
            });
        }
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        if (!workspaceId)
            return res.status(400).json({ message: 'Workspace ID is required' });
        const workspace = await prisma_1.prisma.workspace.findFirst({
            where: { id: workspaceId, members: { some: { userId } } },
        });
        if (!workspace)
            return res.status(404).json({ message: 'Workspace not found or unauthorized' });
        const queryParentId = parentId === 'null' ? null : parentId;
        const pages = await prisma_1.prisma.page.findMany({
            where: {
                workspaceId: workspaceId,
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
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getPages = getPages;
const getPageById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (process.env.SKIP_AUTH === 'true') {
            return res.status(200).json({
                data: {
                    id: id,
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
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const page = await prisma_1.prisma.page.findUnique({
            where: { id: id },
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
        if (!page)
            return res.status(404).json({ message: 'Page not found' });
        return res.status(200).json({ data: page });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getPageById = getPageById;
const updatePage = async (req, res) => {
    try {
        const id = req.params.id;
        const { title, content, icon, coverImage, fontStyle, isFullWidth, isSmallText } = req.body;
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const page = await prisma_1.prisma.page.findUnique({
            where: { id: id },
            include: { workspace: { include: { members: { where: { userId } } } } }
        });
        if (!page)
            return res.status(404).json({ message: 'Page not found' });
        const updatedPage = await prisma_1.prisma.page.update({
            where: { id: id },
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
            const lastVersion = await prisma_1.prisma.pageVersion.findFirst({
                where: { pageId: id, createdById: userId },
                orderBy: { createdAt: 'desc' }
            });
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            if (!lastVersion || lastVersion.createdAt < fiveMinutesAgo) {
                await prisma_1.prisma.pageVersion.create({
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
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updatePage = updatePage;
const getPageVersions = async (req, res) => {
    try {
        const id = req.params.id;
        const versions = await prisma_1.prisma.pageVersion.findMany({
            where: { pageId: id },
            orderBy: { createdAt: 'desc' },
            include: {
                createdBy: {
                    select: { id: true, name: true, avatar: true }
                }
            }
        });
        return res.status(200).json({ data: versions });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getPageVersions = getPageVersions;
const getPageVersionById = async (req, res) => {
    try {
        const versionId = req.params.versionId;
        const version = await prisma_1.prisma.pageVersion.findUnique({
            where: { id: versionId },
            include: {
                createdBy: {
                    select: { id: true, name: true, avatar: true }
                }
            }
        });
        if (!version)
            return res.status(404).json({ message: 'Version not found' });
        return res.status(200).json({ data: version });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getPageVersionById = getPageVersionById;
const restorePageVersion = async (req, res) => {
    try {
        const id = req.params.id;
        const versionId = req.params.versionId;
        const version = await prisma_1.prisma.pageVersion.findUnique({
            where: { id: versionId }
        });
        if (!version || version.pageId !== id) {
            return res.status(404).json({ message: 'Version not found' });
        }
        const updatedPage = await prisma_1.prisma.page.update({
            where: { id },
            data: {
                content: version.content,
                title: version.title,
                updatedAt: new Date()
            }
        });
        return res.status(200).json({ data: updatedPage });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.restorePageVersion = restorePageVersion;
const deletePage = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const page = await prisma_1.prisma.page.findUnique({
            where: { id: id },
            include: { workspace: { include: { members: { where: { userId, role: { in: ['OWNER', 'ADMIN', 'MEMBER'] } } } } } }
        });
        if (!page)
            return res.status(404).json({ message: 'Page not found' });
        await prisma_1.prisma.page.delete({ where: { id: id } });
        return res.status(200).json({ message: 'Page deleted successfully' });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.deletePage = deletePage;
const sharePage = async (req, res) => {
    try {
        const id = req.params.id;
        const { email, level = 'CAN_VIEW' } = req.body;
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        if (!email)
            return res.status(400).json({ message: 'Email is required' });
        // 1. Find user by email
        const targetUser = await prisma_1.prisma.user.findUnique({
            where: { email }
        });
        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (targetUser.id === userId) {
            return res.status(400).json({ message: 'You cannot share a page with yourself' });
        }
        // 2. Check if permission already exists
        const existingPermission = await prisma_1.prisma.pagePermission.findUnique({
            where: {
                pageId_userId: {
                    pageId: id,
                    userId: targetUser.id
                }
            }
        });
        if (existingPermission) {
            const updatedPermission = await prisma_1.prisma.pagePermission.update({
                where: { id: existingPermission.id },
                data: { level: level }
            });
            return res.status(200).json({ data: updatedPermission });
        }
        // 3. Create new permission
        const permission = await prisma_1.prisma.pagePermission.create({
            data: {
                pageId: id,
                userId: targetUser.id,
                level: level,
                grantedById: userId
            }
        });
        return res.status(201).json({ data: permission });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.sharePage = sharePage;
const getPagePermissions = async (req, res) => {
    try {
        const id = req.params.id;
        const permissions = await prisma_1.prisma.pagePermission.findMany({
            where: { pageId: id },
            include: {
                user: {
                    select: { id: true, name: true, email: true, avatar: true }
                }
            }
        });
        return res.status(200).json({ data: permissions });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getPagePermissions = getPagePermissions;
const removePagePermission = async (req, res) => {
    try {
        const id = req.params.id;
        const permissionId = req.params.permissionId;
        await prisma_1.prisma.pagePermission.delete({
            where: { id: permissionId, pageId: id }
        });
        return res.status(200).json({ message: 'Permission removed' });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.removePagePermission = removePagePermission;
