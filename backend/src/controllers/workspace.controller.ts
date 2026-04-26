import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export const createWorkspace = async (req: AuthRequest, res: Response) => {
    try {
        const { name, icon, description } = req.body;
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });
        if (!name) return res.status(400).json({ message: 'Name is required' });

        const workspace = await prisma.workspace.create({
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
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const getWorkspaces = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

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

        const workspaces = await prisma.workspace.findMany({
            where: { members: { some: { userId } } },
            include: { owner: { select: { id: true, name: true, email: true, avatar: true } } },
            orderBy: { createdAt: 'desc' },
        });

        return res.status(200).json({ data: workspaces });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const getWorkspaceById = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        if (process.env.SKIP_AUTH === 'true') {
            return res.status(200).json({
                data: {
                    id: id as string,
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

        const workspace = await prisma.workspace.findFirst({
            where: { id: id as string, members: { some: { userId } } },
            include: { owner: { select: { id: true, name: true, avatar: true } }, members: { include: { user: { select: { id: true, name: true, avatar: true, email: true } } } } },
        });

        if (!workspace) return res.status(404).json({ message: 'Workspace not found or unauthorized' });

        return res.status(200).json({ data: workspace });
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateWorkspace = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, icon, description } = req.body;
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        if (process.env.SKIP_AUTH === 'true') {
            return res.status(200).json({ data: { id, name, icon, description } });
        }

        const workspace = await prisma.workspace.findFirst({
            where: { id: id as string, members: { some: { userId, role: { in: ['OWNER', 'ADMIN'] } } } },
        });

        if (!workspace) return res.status(404).json({ message: 'Workspace not found or missing permissions' });

        const updated = await prisma.workspace.update({
            where: { id: id as string },
            data: { name, icon, description },
        });

        return res.status(200).json({ data: updated });
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const deleteWorkspace = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        if (process.env.SKIP_AUTH === 'true') {
            return res.status(200).json({ message: 'Workspace deleted successfully' });
        }

        const workspace = await prisma.workspace.findFirst({
            where: { id: id as string, ownerId: userId },
        });

        if (!workspace) return res.status(404).json({ message: 'Workspace not found or you are not the owner' });

        await prisma.workspace.delete({
            where: { id: id as string },
        });

        return res.status(200).json({ message: 'Workspace deleted successfully' });
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const addWorkspaceMember = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { userId, role = 'MEMBER' } = req.body;
        const currentUserId = req.user?.id;

        if (!currentUserId) return res.status(401).json({ message: 'Unauthorized' });

        const workspace = await prisma.workspace.findFirst({
            where: { id: id as string, members: { some: { userId: currentUserId, role: { in: ['OWNER', 'ADMIN'] } } } },
        });

        if (!workspace) return res.status(404).json({ message: 'Workspace not found or missing permissions' });

        const member = await prisma.workspaceMember.create({
            data: {
                workspaceId: id as string,
                userId,
                role: role as any,
            },
            include: {
                user: { select: { id: true, name: true, email: true, avatar: true } }
            }
        });

        return res.status(201).json({ data: member });
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateMemberRole = async (req: AuthRequest, res: Response) => {
    try {
        const { id, memberId } = req.params;
        const { role } = req.body;
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const workspace = await prisma.workspace.findFirst({
            where: { id: id as string, members: { some: { userId, role: { in: ['OWNER', 'ADMIN'] } } } },
        });

        if (!workspace) return res.status(404).json({ message: 'Workspace not found or missing permissions' });

        const updated = await prisma.workspaceMember.update({
            where: { id: memberId as string },
            data: { role: role as any },
            include: { user: { select: { id: true, name: true, email: true, avatar: true } } }
        });

        return res.status(200).json({ data: updated });
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const removeWorkspaceMember = async (req: AuthRequest, res: Response) => {
    try {
        const { id, memberId } = req.params;
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const workspace = await prisma.workspace.findFirst({
            where: { id: id as string },
            include: { members: true }
        });

        if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

        const targetMember = workspace.members.find(m => m.id === memberId);
        if (!targetMember) return res.status(404).json({ message: 'Member not found' });

        // Can't remove owner
        if (targetMember.role === 'OWNER') return res.status(400).json({ message: 'Cannot remove the owner' });

        // Permissions check
        const currentUserMember = workspace.members.find(m => m.userId === userId);
        if (!currentUserMember || (currentUserMember.role !== 'OWNER' && currentUserMember.role !== 'ADMIN')) {
            // Member removing themselves
            if (targetMember.userId !== userId) {
                return res.status(403).json({ message: 'Unauthorized' });
            }
        }

        await prisma.workspaceMember.delete({
            where: { id: memberId as string },
        });

        return res.status(200).json({ message: 'Member removed successfully' });
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};

