"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeWorkspaceMember = exports.updateMemberRole = exports.addWorkspaceMember = exports.deleteWorkspace = exports.updateWorkspace = exports.getWorkspaceById = exports.getWorkspaces = exports.createWorkspace = void 0;
const prisma_1 = require("../lib/prisma");
const createWorkspace = async (req, res) => {
    try {
        const { name, icon, description } = req.body;
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        if (!name)
            return res.status(400).json({ message: 'Name is required' });
        const workspace = await prisma_1.prisma.workspace.create({
            data: {
                name,
                icon,
                description,
                ownerId: userId,
                members: {
                    create: {
                        userId,
                        role: 'OWNER',
                    },
                },
            },
            include: {
                members: true,
            },
        });
        return res.status(201).json({ data: workspace });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createWorkspace = createWorkspace;
const getWorkspaces = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        if (process.env.SKIP_AUTH === 'true') {
            return res.status(200).json({
                data: [
                    {
                        id: 'mock-workspace-id',
                        name: 'Mock Workspace',
                        icon: '🏢',
                        ownerId: userId,
                        owner: { id: userId, name: 'Mock User', email: 'mock@example.com' },
                        createdAt: new Date().toISOString()
                    }
                ]
            });
        }
        const workspaces = await prisma_1.prisma.workspace.findMany({
            where: { members: { some: { userId } } },
            include: { owner: { select: { id: true, name: true, email: true, avatar: true } } },
            orderBy: { createdAt: 'desc' },
        });
        return res.status(200).json({ data: workspaces });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getWorkspaces = getWorkspaces;
const getWorkspaceById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        if (process.env.SKIP_AUTH === 'true') {
            return res.status(200).json({
                data: {
                    id: id,
                    name: 'Mock Workspace',
                    icon: '🏢',
                    ownerId: userId,
                    members: [
                        {
                            id: 'mock-member-id',
                            userId,
                            role: 'OWNER',
                            user: { id: userId, name: 'Mock User', email: 'mock@example.com' }
                        }
                    ],
                    owner: { id: userId, name: 'Mock User', email: 'mock@example.com' },
                    createdAt: new Date().toISOString()
                }
            });
        }
        const workspace = await prisma_1.prisma.workspace.findFirst({
            where: { id: id, members: { some: { userId } } },
            include: { owner: { select: { id: true, name: true, avatar: true } }, members: { include: { user: { select: { id: true, name: true, avatar: true, email: true } } } } },
        });
        if (!workspace)
            return res.status(404).json({ message: 'Workspace not found or unauthorized' });
        return res.status(200).json({ data: workspace });
    }
    catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getWorkspaceById = getWorkspaceById;
const updateWorkspace = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, icon, description } = req.body;
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        if (process.env.SKIP_AUTH === 'true') {
            return res.status(200).json({ data: { id, name, icon, description } });
        }
        const workspace = await prisma_1.prisma.workspace.findFirst({
            where: { id: id, members: { some: { userId, role: { in: ['OWNER', 'ADMIN'] } } } },
        });
        if (!workspace)
            return res.status(404).json({ message: 'Workspace not found or missing permissions' });
        const updated = await prisma_1.prisma.workspace.update({
            where: { id: id },
            data: { name, icon, description },
        });
        return res.status(200).json({ data: updated });
    }
    catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateWorkspace = updateWorkspace;
const deleteWorkspace = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        if (process.env.SKIP_AUTH === 'true') {
            return res.status(200).json({ message: 'Workspace deleted successfully' });
        }
        const workspace = await prisma_1.prisma.workspace.findFirst({
            where: { id: id, ownerId: userId },
        });
        if (!workspace)
            return res.status(404).json({ message: 'Workspace not found or you are not the owner' });
        await prisma_1.prisma.workspace.delete({
            where: { id: id },
        });
        return res.status(200).json({ message: 'Workspace deleted successfully' });
    }
    catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.deleteWorkspace = deleteWorkspace;
const addWorkspaceMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, role = 'MEMBER' } = req.body;
        const currentUserId = req.user?.id;
        if (!currentUserId)
            return res.status(401).json({ message: 'Unauthorized' });
        const workspace = await prisma_1.prisma.workspace.findFirst({
            where: { id: id, members: { some: { userId: currentUserId, role: { in: ['OWNER', 'ADMIN'] } } } },
        });
        if (!workspace)
            return res.status(404).json({ message: 'Workspace not found or missing permissions' });
        const member = await prisma_1.prisma.workspaceMember.create({
            data: {
                workspaceId: id,
                userId,
                role: role,
            },
            include: {
                user: { select: { id: true, name: true, email: true, avatar: true } }
            }
        });
        return res.status(201).json({ data: member });
    }
    catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.addWorkspaceMember = addWorkspaceMember;
const updateMemberRole = async (req, res) => {
    try {
        const { id, memberId } = req.params;
        const { role } = req.body;
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const workspace = await prisma_1.prisma.workspace.findFirst({
            where: { id: id, members: { some: { userId, role: { in: ['OWNER', 'ADMIN'] } } } },
        });
        if (!workspace)
            return res.status(404).json({ message: 'Workspace not found or missing permissions' });
        const updated = await prisma_1.prisma.workspaceMember.update({
            where: { id: memberId },
            data: { role: role },
            include: { user: { select: { id: true, name: true, email: true, avatar: true } } }
        });
        return res.status(200).json({ data: updated });
    }
    catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateMemberRole = updateMemberRole;
const removeWorkspaceMember = async (req, res) => {
    try {
        const { id, memberId } = req.params;
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const workspace = await prisma_1.prisma.workspace.findFirst({
            where: { id: id },
            include: { members: true }
        });
        if (!workspace)
            return res.status(404).json({ message: 'Workspace not found' });
        const targetMember = workspace.members.find(m => m.id === memberId);
        if (!targetMember)
            return res.status(404).json({ message: 'Member not found' });
        // Can't remove owner
        if (targetMember.role === 'OWNER')
            return res.status(400).json({ message: 'Cannot remove the owner' });
        // Permissions check
        const currentUserMember = workspace.members.find(m => m.userId === userId);
        if (!currentUserMember || (currentUserMember.role !== 'OWNER' && currentUserMember.role !== 'ADMIN')) {
            // Member removing themselves
            if (targetMember.userId !== userId) {
                return res.status(403).json({ message: 'Unauthorized' });
            }
        }
        await prisma_1.prisma.workspaceMember.delete({
            where: { id: memberId },
        });
        return res.status(200).json({ message: 'Member removed successfully' });
    }
    catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.removeWorkspaceMember = removeWorkspaceMember;
