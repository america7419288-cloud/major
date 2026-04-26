import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

// Database CRUD
export const createDatabase = async (req: AuthRequest, res: Response) => {
    try {
        const { name, workspaceId, pageId, schema, icon, description } = req.body;
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        // Verify workspace membership
        const member = await prisma.workspaceMember.findFirst({
            where: { workspaceId, userId, role: { in: ['OWNER', 'ADMIN', 'MEMBER'] } }
        });

        if (!member) return res.status(403).json({ message: 'Forbidden' });

        const database = await prisma.database.create({
            data: {
                name,
                workspaceId,
                pageId,
                schema: schema || {},
                icon,
                description,
            }
        });

        // Create a default Table view
        await prisma.databaseView.create({
            data: {
                databaseId: database.id,
                name: 'Table View',
                type: 'TABLE',
                config: {},
                position: 0
            }
        });

        return res.status(201).json({ data: database });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const getDatabases = async (req: AuthRequest, res: Response) => {
    try {
        const { workspaceId } = req.query;
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const databases = await prisma.database.findMany({
            where: {
                workspaceId: workspaceId as string,
                workspace: { members: { some: { userId } } }
            },
            include: { views: true }
        });

        return res.status(200).json({ data: databases });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const getDatabaseById = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const database = await prisma.database.findUnique({
            where: { id: id as string },
            include: {
                views: { orderBy: { position: 'asc' } },
                items: { orderBy: { position: 'asc' } },
                workspace: { include: { members: { where: { userId } } } }
            }
        });

        if (!database) return res.status(404).json({ message: 'Database not found' });
        if (database.workspace.members.length === 0) return res.status(403).json({ message: 'Forbidden' });

        return res.status(200).json({ data: database });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateDatabase = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, schema, icon, description } = req.body;
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const database = await prisma.database.findUnique({
            where: { id: id as string },
            include: { workspace: { include: { members: { where: { userId, role: { in: ['OWNER', 'ADMIN'] } } } } } }
        });

        if (!database) return res.status(404).json({ message: 'Database not found' });
        if (database.workspace.members.length === 0) return res.status(403).json({ message: 'Forbidden' });

        const updatedDatabase = await prisma.database.update({
            where: { id: id as string },
            data: { name, schema, icon, description }
        });

        return res.status(200).json({ data: updatedDatabase });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const deleteDatabase = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const database = await prisma.database.findUnique({
            where: { id: id as string },
            include: { workspace: { include: { members: { where: { userId, role: { in: ['OWNER', 'ADMIN'] } } } } } }
        });

        if (!database) return res.status(404).json({ message: 'Database not found' });
        if (database.workspace.members.length === 0) return res.status(403).json({ message: 'Forbidden' });

        await prisma.database.delete({ where: { id: id as string } });

        return res.status(200).json({ message: 'Database deleted successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Database Item CRUD
export const createDatabaseItem = async (req: AuthRequest, res: Response) => {
    try {
        const { databaseId, properties, position } = req.body;
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const database = await prisma.database.findUnique({
            where: { id: databaseId },
            include: { workspace: { include: { members: { where: { userId } } } } }
        });

        if (!database) return res.status(404).json({ message: 'Database not found' });
        if (database.workspace.members.length === 0) return res.status(403).json({ message: 'Forbidden' });

        const lastItem = await prisma.databaseItem.findFirst({
            where: { databaseId },
            orderBy: { position: 'desc' }
        });

        const item = await prisma.databaseItem.create({
            data: {
                databaseId,
                properties: properties || {},
                position: position || (lastItem ? lastItem.position + 1000 : 1000)
            }
        });

        return res.status(201).json({ data: item });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateDatabaseItem = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { properties, position } = req.body;
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const item = await prisma.databaseItem.findUnique({
            where: { id: id as string },
            include: { database: { include: { workspace: { include: { members: { where: { userId } } } } } } }
        });

        if (!item) return res.status(404).json({ message: 'Item not found' });
        if (item.database.workspace.members.length === 0) return res.status(403).json({ message: 'Forbidden' });

        const updatedItem = await prisma.databaseItem.update({
            where: { id: id as string },
            data: { properties, position }
        });

        return res.status(200).json({ data: updatedItem });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const deleteDatabaseItem = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const item = await prisma.databaseItem.findUnique({
            where: { id: id as string },
            include: { database: { include: { workspace: { include: { members: { where: { userId } } } } } } }
        });

        if (!item) return res.status(404).json({ message: 'Item not found' });
        if (item.database.workspace.members.length === 0) return res.status(403).json({ message: 'Forbidden' });

        await prisma.databaseItem.delete({ where: { id: id as string } });

        return res.status(200).json({ message: 'Item deleted successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Database View CRUD
export const createDatabaseView = async (req: AuthRequest, res: Response) => {
    try {
        const { databaseId, name, type, config, position } = req.body;
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const database = await prisma.database.findUnique({
            where: { id: databaseId },
            include: { workspace: { include: { members: { where: { userId, role: { in: ['OWNER', 'ADMIN'] } } } } } }
        });

        if (!database) return res.status(404).json({ message: 'Database not found' });
        if (database.workspace.members.length === 0) return res.status(403).json({ message: 'Forbidden' });

        const view = await prisma.databaseView.create({
            data: {
                databaseId,
                name,
                type,
                config: config || {},
                position: position || 0
            }
        });

        return res.status(201).json({ data: view });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateDatabaseView = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, type, config, position } = req.body;
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const view = await prisma.databaseView.findUnique({
            where: { id: id as string },
            include: { database: { include: { workspace: { include: { members: { where: { userId, role: { in: ['OWNER', 'ADMIN'] } } } } } } } }
        });

        if (!view) return res.status(404).json({ message: 'View not found' });
        if (view.database.workspace.members.length === 0) return res.status(403).json({ message: 'Forbidden' });

        const updatedView = await prisma.databaseView.update({
            where: { id: id as string },
            data: { name, type, config, position }
        });

        return res.status(200).json({ data: updatedView });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const deleteDatabaseView = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const view = await prisma.databaseView.findUnique({
            where: { id: id as string },
            include: { database: { include: { workspace: { include: { members: { where: { userId, role: { in: ['OWNER', 'ADMIN'] } } } } } } } }
        });

        if (!view) return res.status(404).json({ message: 'View not found' });
        if (view.database.workspace.members.length === 0) return res.status(403).json({ message: 'Forbidden' });

        await prisma.databaseView.delete({ where: { id: id as string } });

        return res.status(200).json({ message: 'View deleted successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
