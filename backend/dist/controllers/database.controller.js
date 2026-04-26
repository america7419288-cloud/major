"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDatabaseView = exports.updateDatabaseView = exports.createDatabaseView = exports.deleteDatabaseItem = exports.updateDatabaseItem = exports.createDatabaseItem = exports.deleteDatabase = exports.updateDatabase = exports.getDatabaseById = exports.getDatabases = exports.createDatabase = void 0;
const prisma_1 = require("../lib/prisma");
// Database CRUD
const createDatabase = async (req, res) => {
    try {
        const { name, workspaceId, pageId, schema, icon, description } = req.body;
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        // Verify workspace membership
        const member = await prisma_1.prisma.workspaceMember.findFirst({
            where: { workspaceId, userId, role: { in: ['OWNER', 'ADMIN', 'MEMBER'] } }
        });
        if (!member)
            return res.status(403).json({ message: 'Forbidden' });
        const database = await prisma_1.prisma.database.create({
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
        await prisma_1.prisma.databaseView.create({
            data: {
                databaseId: database.id,
                name: 'Table View',
                type: 'TABLE',
                config: {},
                position: 0
            }
        });
        return res.status(201).json({ data: database });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createDatabase = createDatabase;
const getDatabases = async (req, res) => {
    try {
        const { workspaceId } = req.query;
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const databases = await prisma_1.prisma.database.findMany({
            where: {
                workspaceId: workspaceId,
                workspace: { members: { some: { userId } } }
            },
            include: { views: true }
        });
        return res.status(200).json({ data: databases });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getDatabases = getDatabases;
const getDatabaseById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const database = await prisma_1.prisma.database.findUnique({
            where: { id: id },
            include: {
                views: { orderBy: { position: 'asc' } },
                items: { orderBy: { position: 'asc' } },
                workspace: { include: { members: { where: { userId } } } }
            }
        });
        if (!database)
            return res.status(404).json({ message: 'Database not found' });
        if (database.workspace.members.length === 0)
            return res.status(403).json({ message: 'Forbidden' });
        return res.status(200).json({ data: database });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getDatabaseById = getDatabaseById;
const updateDatabase = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, schema, icon, description } = req.body;
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const database = await prisma_1.prisma.database.findUnique({
            where: { id: id },
            include: { workspace: { include: { members: { where: { userId, role: { in: ['OWNER', 'ADMIN'] } } } } } }
        });
        if (!database)
            return res.status(404).json({ message: 'Database not found' });
        if (database.workspace.members.length === 0)
            return res.status(403).json({ message: 'Forbidden' });
        const updatedDatabase = await prisma_1.prisma.database.update({
            where: { id: id },
            data: { name, schema, icon, description }
        });
        return res.status(200).json({ data: updatedDatabase });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateDatabase = updateDatabase;
const deleteDatabase = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const database = await prisma_1.prisma.database.findUnique({
            where: { id: id },
            include: { workspace: { include: { members: { where: { userId, role: { in: ['OWNER', 'ADMIN'] } } } } } }
        });
        if (!database)
            return res.status(404).json({ message: 'Database not found' });
        if (database.workspace.members.length === 0)
            return res.status(403).json({ message: 'Forbidden' });
        await prisma_1.prisma.database.delete({ where: { id: id } });
        return res.status(200).json({ message: 'Database deleted successfully' });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.deleteDatabase = deleteDatabase;
// Database Item CRUD
const createDatabaseItem = async (req, res) => {
    try {
        const { databaseId, properties, position } = req.body;
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const database = await prisma_1.prisma.database.findUnique({
            where: { id: databaseId },
            include: { workspace: { include: { members: { where: { userId } } } } }
        });
        if (!database)
            return res.status(404).json({ message: 'Database not found' });
        if (database.workspace.members.length === 0)
            return res.status(403).json({ message: 'Forbidden' });
        const lastItem = await prisma_1.prisma.databaseItem.findFirst({
            where: { databaseId },
            orderBy: { position: 'desc' }
        });
        const item = await prisma_1.prisma.databaseItem.create({
            data: {
                databaseId,
                properties: properties || {},
                position: position || (lastItem ? lastItem.position + 1000 : 1000)
            }
        });
        return res.status(201).json({ data: item });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createDatabaseItem = createDatabaseItem;
const updateDatabaseItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { properties, position } = req.body;
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const item = await prisma_1.prisma.databaseItem.findUnique({
            where: { id: id },
            include: { database: { include: { workspace: { include: { members: { where: { userId } } } } } } }
        });
        if (!item)
            return res.status(404).json({ message: 'Item not found' });
        if (item.database.workspace.members.length === 0)
            return res.status(403).json({ message: 'Forbidden' });
        const updatedItem = await prisma_1.prisma.databaseItem.update({
            where: { id: id },
            data: { properties, position }
        });
        return res.status(200).json({ data: updatedItem });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateDatabaseItem = updateDatabaseItem;
const deleteDatabaseItem = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const item = await prisma_1.prisma.databaseItem.findUnique({
            where: { id: id },
            include: { database: { include: { workspace: { include: { members: { where: { userId } } } } } } }
        });
        if (!item)
            return res.status(404).json({ message: 'Item not found' });
        if (item.database.workspace.members.length === 0)
            return res.status(403).json({ message: 'Forbidden' });
        await prisma_1.prisma.databaseItem.delete({ where: { id: id } });
        return res.status(200).json({ message: 'Item deleted successfully' });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.deleteDatabaseItem = deleteDatabaseItem;
// Database View CRUD
const createDatabaseView = async (req, res) => {
    try {
        const { databaseId, name, type, config, position } = req.body;
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const database = await prisma_1.prisma.database.findUnique({
            where: { id: databaseId },
            include: { workspace: { include: { members: { where: { userId, role: { in: ['OWNER', 'ADMIN'] } } } } } }
        });
        if (!database)
            return res.status(404).json({ message: 'Database not found' });
        if (database.workspace.members.length === 0)
            return res.status(403).json({ message: 'Forbidden' });
        const view = await prisma_1.prisma.databaseView.create({
            data: {
                databaseId,
                name,
                type,
                config: config || {},
                position: position || 0
            }
        });
        return res.status(201).json({ data: view });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createDatabaseView = createDatabaseView;
const updateDatabaseView = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, config, position } = req.body;
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const view = await prisma_1.prisma.databaseView.findUnique({
            where: { id: id },
            include: { database: { include: { workspace: { include: { members: { where: { userId, role: { in: ['OWNER', 'ADMIN'] } } } } } } } }
        });
        if (!view)
            return res.status(404).json({ message: 'View not found' });
        if (view.database.workspace.members.length === 0)
            return res.status(403).json({ message: 'Forbidden' });
        const updatedView = await prisma_1.prisma.databaseView.update({
            where: { id: id },
            data: { name, type, config, position }
        });
        return res.status(200).json({ data: updatedView });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateDatabaseView = updateDatabaseView;
const deleteDatabaseView = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const view = await prisma_1.prisma.databaseView.findUnique({
            where: { id: id },
            include: { database: { include: { workspace: { include: { members: { where: { userId, role: { in: ['OWNER', 'ADMIN'] } } } } } } } }
        });
        if (!view)
            return res.status(404).json({ message: 'View not found' });
        if (view.database.workspace.members.length === 0)
            return res.status(403).json({ message: 'Forbidden' });
        await prisma_1.prisma.databaseView.delete({ where: { id: id } });
        return res.status(200).json({ message: 'View deleted successfully' });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.deleteDatabaseView = deleteDatabaseView;
