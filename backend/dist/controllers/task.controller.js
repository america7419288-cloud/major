"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moveTask = exports.deleteTask = exports.copyTaskToWorkspace = exports.updateTask = exports.getTaskById = exports.getTasks = exports.createTask = void 0;
const prisma_1 = require("../lib/prisma");
const socket_1 = require("../socket");
const activity_1 = require("../utils/activity");
const NotificationController_1 = require("./NotificationController");
const mail_1 = require("../lib/mail");
const createTask = async (req, res) => {
    try {
        let { title, description, status, priority, dueDate, assigneeId, assigneeEmail, workspaceId, pageId } = req.body;
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        if (!workspaceId)
            return res.status(400).json({ message: 'Workspace ID is required' });
        if (process.env.SKIP_AUTH === 'true') {
            const task = {
                id: `mock-task-${Date.now()}`,
                title: title || 'Untitled Task',
                description: description || '[]',
                status: status || 'TODO',
                priority: priority || 'MEDIUM',
                workspaceId,
                pageId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            return res.status(201).json({ data: task });
        }
        const workspace = await prisma_1.prisma.workspace.findFirst({
            where: { id: workspaceId, members: { some: { userId } } },
        });
        if (!workspace)
            return res.status(404).json({ message: 'Workspace not found or unauthorized' });
        if (assigneeEmail && !assigneeId) {
            let assigneeUser = await prisma_1.prisma.user.findUnique({
                where: { email: assigneeEmail }
            });
            const currentUser = await prisma_1.prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
            const inviterName = currentUser?.name || 'A teammate';
            if (!assigneeUser) {
                // Create placeholder user
                assigneeUser = await prisma_1.prisma.user.create({
                    data: {
                        email: assigneeEmail,
                        name: assigneeEmail.split('@')[0],
                    }
                });
                // Add to workspace
                await prisma_1.prisma.workspaceMember.create({
                    data: {
                        userId: assigneeUser.id,
                        workspaceId,
                        role: 'MEMBER'
                    }
                });
                try {
                    await mail_1.emailService.sendInvitationEmail(assigneeEmail, workspace.name, title, inviterName);
                }
                catch (emailErr) {
                    console.error('Failed to send invitation email:', emailErr);
                }
                assigneeId = assigneeUser.id;
            }
            else {
                // Check if user is in workspace
                const isMember = await prisma_1.prisma.workspaceMember.findUnique({
                    where: { userId_workspaceId: { userId: assigneeUser.id, workspaceId } }
                });
                if (!isMember) {
                    await prisma_1.prisma.workspaceMember.create({
                        data: {
                            userId: assigneeUser.id,
                            workspaceId,
                            role: 'MEMBER'
                        }
                    });
                    try {
                        await mail_1.emailService.sendInvitationEmail(assigneeEmail, workspace.name, title, inviterName);
                    }
                    catch (emailErr) {
                        console.error('Failed to send invitation email:', emailErr);
                    }
                }
                else if (assigneeUser.id !== userId) {
                    try {
                        await mail_1.emailService.sendAssignmentNotification(assigneeEmail, title, inviterName);
                    }
                    catch (emailErr) {
                        console.error('Failed to send assignment email:', emailErr);
                    }
                }
                assigneeId = assigneeUser.id;
            }
        }
        const task = await prisma_1.prisma.task.create({
            data: {
                title: title || 'Untitled Task',
                description: description || '[]',
                status: status || 'TODO',
                priority,
                dueDate,
                assigneeId,
                createdById: userId,
                workspaceId,
                pageId,
                position: Date.now(),
            },
            include: {
                assignee: { select: { id: true, name: true, avatar: true, email: true } },
                creator: { select: { id: true, name: true, avatar: true } },
            },
        });
        await (0, activity_1.logActivity)(userId, 'TASK', task.id, 'created');
        socket_1.socketService.broadcastToWorkspace(workspaceId, 'task:created', task);
        if (assigneeId && assigneeId !== userId) {
            try {
                await NotificationController_1.NotificationController.createNotification({
                    userId: assigneeId,
                    type: 'ASSIGNMENT',
                    title: `You were assigned a task: ${task.title}`,
                    content: 'A new task has been assigned to you.',
                    link: `/tasks?taskId=${task.id}`
                });
            }
            catch (notifErr) {
                console.error('Failed to create notification:', notifErr);
            }
        }
        return res.status(201).json({ data: task });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createTask = createTask;
const getTasks = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { workspaceId, pageId, status, assigneeId } = req.query;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        if (!workspaceId)
            return res.status(400).json({ message: 'Workspace ID is required' });
        if (process.env.SKIP_AUTH === 'true') {
            return res.status(200).json({
                data: [
                    {
                        id: 'mock-task-1',
                        title: 'Complete Project Documentation',
                        status: 'TODO',
                        priority: 'HIGH',
                        workspaceId,
                        createdAt: new Date().toISOString()
                    },
                    {
                        id: 'mock-task-2',
                        title: 'Fix Authentication Bug',
                        status: 'IN_PROGRESS',
                        priority: 'MEDIUM',
                        workspaceId,
                        createdAt: new Date().toISOString()
                    }
                ]
            });
        }
        const workspace = await prisma_1.prisma.workspace.findFirst({
            where: { id: workspaceId, members: { some: { userId } } },
        });
        if (!workspace)
            return res.status(404).json({ message: 'Workspace not found or unauthorized' });
        const tasks = await prisma_1.prisma.task.findMany({
            where: {
                workspaceId: workspaceId,
                ...(pageId ? { pageId: pageId } : {}),
                ...(status ? { status: status } : {}),
                ...(assigneeId ? { assigneeId: assigneeId } : {}),
            },
            include: {
                assignee: { select: { id: true, name: true, avatar: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        return res.status(200).json({ data: tasks });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getTasks = getTasks;
const getTaskById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const taskId = id;
        const task = await prisma_1.prisma.task.findUnique({
            where: { id: taskId },
            include: {
                workspace: { include: { members: { where: { userId } } } },
                assignee: { select: { id: true, name: true, avatar: true } },
                creator: { select: { id: true, name: true, avatar: true } },
            }
        });
        // We can fetch activities and comments separately if needed, since Comment is generic.
        const comments = await prisma_1.prisma.comment.findMany({
            where: { entityType: 'TASK', entityId: taskId },
            include: { user: { select: { id: true, name: true, avatar: true } } },
            orderBy: { createdAt: 'desc' }
        });
        const activities = await prisma_1.prisma.activity.findMany({
            where: { entityType: 'TASK', entityId: taskId },
            include: { user: { select: { id: true, name: true, avatar: true } } },
            orderBy: { createdAt: 'desc' }
        });
        if (!task)
            return res.status(404).json({ message: 'Task not found' });
        if (task.workspace.members.length === 0)
            return res.status(403).json({ message: 'Forbidden' });
        return res.status(200).json({ data: { ...task, comments, activities } });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getTaskById = getTaskById;
const updateTask = async (req, res) => {
    try {
        const id = req.params.id;
        let { title, description, status, priority, dueDate, assigneeId, assigneeEmail } = req.body;
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const task = await prisma_1.prisma.task.findUnique({
            where: { id: id },
            include: { workspace: { include: { members: { where: { userId } } } } }
        });
        if (!task)
            return res.status(404).json({ message: 'Task not found' });
        if (task.workspace.members.length === 0)
            return res.status(403).json({ message: 'Forbidden' });
        // Restrictions for assigned users who aren't creators/admins
        const userRole = task.workspace.members[0].role;
        const isCreator = task.createdById === userId;
        const isAdmin = userRole === 'ADMIN' || userRole === 'OWNER';
        const isAssignee = task.assigneeId === userId;
        if (isAssignee && !isCreator && !isAdmin) {
            // Restriction: Assignee can only update status, priority, dueDate, and description
            if (req.body.title !== undefined && req.body.title !== task.title) {
                return res.status(403).json({ message: 'Restrictions: Assignees cannot change task title' });
            }
            if (req.body.assigneeId !== undefined && req.body.assigneeId !== task.assigneeId) {
                return res.status(403).json({ message: 'Restrictions: Assignees cannot change task assignment' });
            }
        }
        if (assigneeEmail && !assigneeId) {
            let assigneeUser = await prisma_1.prisma.user.findUnique({
                where: { email: assigneeEmail }
            });
            const currentUser = await prisma_1.prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
            const inviterName = currentUser?.name || 'A teammate';
            if (!assigneeUser) {
                // Create placeholder user
                assigneeUser = await prisma_1.prisma.user.create({
                    data: {
                        email: assigneeEmail,
                        name: assigneeEmail.split('@')[0],
                    }
                });
                // Add to workspace
                await prisma_1.prisma.workspaceMember.create({
                    data: {
                        userId: assigneeUser.id,
                        workspaceId: task.workspaceId,
                        role: 'MEMBER'
                    }
                });
                try {
                    await mail_1.emailService.sendInvitationEmail(assigneeEmail, task.workspace.name, title || task.title, inviterName);
                }
                catch (emailErr) {
                    console.error('Failed to send invitation email:', emailErr);
                }
                assigneeId = assigneeUser.id;
            }
            else {
                // Check if user is in workspace
                const isMember = await prisma_1.prisma.workspaceMember.findUnique({
                    where: { userId_workspaceId: { userId: assigneeUser.id, workspaceId: task.workspaceId } }
                });
                if (!isMember) {
                    await prisma_1.prisma.workspaceMember.create({
                        data: {
                            userId: assigneeUser.id,
                            workspaceId: task.workspaceId,
                            role: 'MEMBER'
                        }
                    });
                    try {
                        await mail_1.emailService.sendInvitationEmail(assigneeEmail, task.workspace.name, title || task.title, inviterName);
                    }
                    catch (emailErr) {
                        console.error('Failed to send invitation email:', emailErr);
                    }
                }
                else if (assigneeUser.id !== userId) {
                    try {
                        await mail_1.emailService.sendAssignmentNotification(assigneeEmail, title || task.title, inviterName);
                    }
                    catch (emailErr) {
                        console.error('Failed to send assignment email:', emailErr);
                    }
                }
                assigneeId = assigneeUser.id;
            }
        }
        const updatedTask = await prisma_1.prisma.task.update({
            where: { id: id },
            data: { title, description, status: status, priority, dueDate, assigneeId },
            include: {
                assignee: { select: { id: true, name: true, avatar: true, email: true } },
                creator: { select: { id: true, name: true, avatar: true } },
            },
        });
        if (status && task.status !== status) {
            await (0, activity_1.logActivity)(userId, 'TASK', updatedTask.id, 'status_changed', { from: task.status, to: status });
        }
        else {
            await (0, activity_1.logActivity)(userId, 'TASK', updatedTask.id, 'updated');
        }
        socket_1.socketService.broadcastToWorkspace(updatedTask.workspaceId, 'task:updated', updatedTask);
        if (assigneeId && assigneeId !== task.assigneeId && assigneeId !== userId) {
            try {
                await NotificationController_1.NotificationController.createNotification({
                    userId: assigneeId,
                    type: 'ASSIGNMENT',
                    title: `You were assigned a task: ${updatedTask.title}`,
                    content: 'A task has been assigned to you.',
                    link: `/tasks?taskId=${updatedTask.id}`
                });
            }
            catch (notifErr) {
                console.error('Failed to create notification:', notifErr);
            }
        }
        return res.status(200).json({ data: updatedTask });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateTask = updateTask;
const copyTaskToWorkspace = async (req, res) => {
    try {
        const { id } = req.params;
        const { targetWorkspaceId } = req.body;
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const sourceTask = await prisma_1.prisma.task.findUnique({
            where: { id: id },
            include: { workspace: { include: { members: { where: { userId } } } } }
        });
        if (!sourceTask)
            return res.status(404).json({ message: 'Source task not found' });
        // Verify target workspace access
        const targetWorkspace = await prisma_1.prisma.workspace.findFirst({
            where: { id: targetWorkspaceId, members: { some: { userId } } }
        });
        if (!targetWorkspace)
            return res.status(404).json({ message: 'Target workspace not found or unauthorized' });
        const newTask = await prisma_1.prisma.task.create({
            data: {
                title: `${sourceTask.title} (Added)`,
                description: sourceTask.description || '[]',
                status: sourceTask.status,
                priority: sourceTask.priority,
                dueDate: sourceTask.dueDate,
                assigneeId: userId,
                createdById: userId,
                workspaceId: targetWorkspaceId,
                position: Date.now(),
            },
            include: {
                assignee: { select: { id: true, name: true, avatar: true } },
                creator: { select: { id: true, name: true, avatar: true } },
            }
        });
        await (0, activity_1.logActivity)(userId, 'TASK', newTask.id, 'copied_from', { sourceTaskId: id });
        socket_1.socketService.broadcastToWorkspace(targetWorkspaceId, 'task:created', newTask);
        return res.status(201).json({ data: newTask });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.copyTaskToWorkspace = copyTaskToWorkspace;
const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const task = await prisma_1.prisma.task.findUnique({
            where: { id: id },
            include: { workspace: { include: { members: { where: { userId, role: { in: ['OWNER', 'ADMIN', 'MEMBER'] } } } } } }
        });
        if (!task)
            return res.status(404).json({ message: 'Task not found' });
        if (task.workspace.members.length === 0)
            return res.status(403).json({ message: 'Forbidden' });
        // Restriction: Only creators or workspace admins/owners can delete tasks
        const userRole = task.workspace.members[0].role;
        const isCreator = task.createdById === userId;
        const isAdmin = userRole === 'ADMIN' || userRole === 'OWNER';
        if (!isCreator && !isAdmin) {
            return res.status(403).json({ message: 'Restrictions: Only task creators or workspace admins can delete tasks' });
        }
        await prisma_1.prisma.task.delete({ where: { id: id } });
        socket_1.socketService.broadcastToWorkspace(task.workspaceId, 'task:deleted', { taskId: id });
        return res.status(200).json({ message: 'Task deleted successfully' });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.deleteTask = deleteTask;
const moveTask = async (req, res) => {
    try {
        const id = req.params.id;
        const { newStatus, position } = req.body;
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const task = await prisma_1.prisma.task.findUnique({
            where: { id },
            include: { workspace: { include: { members: { where: { userId } } } } }
        });
        if (!task)
            return res.status(404).json({ message: 'Task not found' });
        if (task.workspace.members.length === 0)
            return res.status(403).json({ message: 'Forbidden' });
        const updatedTask = await prisma_1.prisma.task.update({
            where: { id },
            data: {
                status: newStatus,
                position: position
            },
        });
        if (task.status !== newStatus) {
            await (0, activity_1.logActivity)(userId, 'TASK', updatedTask.id, 'status_changed', { from: task.status, to: newStatus });
        }
        socket_1.socketService.broadcastToWorkspace(updatedTask.workspaceId, 'task:moved', {
            taskId: updatedTask.id,
            oldStatus: task.status,
            newStatus: updatedTask.status,
            position: updatedTask.position,
            task: updatedTask, // Include full task for easier UI updates
        });
        return res.status(200).json({ data: updatedTask });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.moveTask = moveTask;
