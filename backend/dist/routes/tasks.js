"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validateTask_1 = require("../middlewares/validateTask");
const socket_1 = require("../socket");
const NotificationController_1 = require("../controllers/NotificationController");
const mail_1 = require("../lib/mail");
const router = (0, express_1.Router)();
/**
 * @route   POST /api/workspaces/:workspaceId/tasks
 * @desc    Create a new task in a workspace.
 *          Supports assigneeEmail: auto-invites the user if not a member,
 *          creates a placeholder account if they don't exist, and sends an email.
 * @access  Authenticated (Workspace Member)
 */
router.post('/workspaces/:workspaceId/tasks', auth_middleware_1.authenticate, validateTask_1.validateCreateTask, async (req, res) => {
    try {
        const { workspaceId } = req.params;
        let { title, description, status, priority, assigneeId, assigneeEmail, dueDate, pageId } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const targetWorkspaceId = workspaceId;
        // Validate workspace + membership
        const workspace = await prisma_1.prisma.workspace.findFirst({
            where: {
                id: targetWorkspaceId,
                members: { some: { userId } }
            }
        });
        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found or access denied' });
        }
        // ── Email-based assignee resolution ───────────────────────────────────────
        if (assigneeEmail && !assigneeId) {
            const currentUser = await prisma_1.prisma.user.findUnique({
                where: { id: userId },
                select: { name: true }
            });
            const inviterName = currentUser?.name || 'A teammate';
            let assigneeUser = await prisma_1.prisma.user.findUnique({
                where: { email: assigneeEmail }
            });
            if (!assigneeUser) {
                // Create placeholder account (no password — user must sign up later)
                assigneeUser = await prisma_1.prisma.user.create({
                    data: {
                        email: assigneeEmail,
                        name: assigneeEmail.split('@')[0],
                    }
                });
                // Auto-add to workspace
                await prisma_1.prisma.workspaceMember.create({
                    data: {
                        userId: assigneeUser.id,
                        workspaceId: targetWorkspaceId,
                        role: 'MEMBER'
                    }
                });
                // Send invitation email
                try {
                    await mail_1.emailService.sendInvitationEmail(assigneeEmail, workspace.name, title, inviterName);
                }
                catch (emailErr) {
                    console.error('Failed to send invitation email:', emailErr);
                }
            }
            else {
                // Check existing membership
                const isMember = await prisma_1.prisma.workspaceMember.findUnique({
                    where: { userId_workspaceId: { userId: assigneeUser.id, workspaceId: targetWorkspaceId } }
                });
                if (!isMember) {
                    await prisma_1.prisma.workspaceMember.create({
                        data: {
                            userId: assigneeUser.id,
                            workspaceId: targetWorkspaceId,
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
            }
            assigneeId = assigneeUser.id;
        }
        // ─────────────────────────────────────────────────────────────────────────
        // Determine status
        const taskStatus = (status?.toUpperCase() || 'TODO');
        // Calculate position (append to bottom of column)
        const maxPosition = await prisma_1.prisma.task.findFirst({
            where: { workspaceId: targetWorkspaceId, status: taskStatus },
            orderBy: { position: 'desc' },
            select: { position: true }
        });
        const position = (maxPosition?.position ?? -1) + 1;
        // Create the task
        const task = await prisma_1.prisma.task.create({
            data: {
                title,
                description: description || null,
                status: taskStatus,
                priority: (priority?.toUpperCase() || 'MEDIUM'),
                assigneeId: assigneeId || null,
                dueDate: dueDate ? new Date(dueDate) : null,
                workspaceId: targetWorkspaceId,
                createdById: userId,
                position,
                pageId: pageId || null
            },
            include: {
                assignee: {
                    select: { id: true, name: true, email: true, avatar: true }
                },
                creator: {
                    select: { id: true, name: true, email: true, avatar: true }
                }
            }
        });
        // Broadcast real-time update
        socket_1.socketService.broadcastToWorkspace(targetWorkspaceId, 'task:created', task);
        // In-app notification for assignee
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
                // Non-fatal — log but don't fail the request
                console.error('Failed to create notification:', notifErr);
            }
        }
        return res.status(201).json({ data: task });
    }
    catch (error) {
        console.error('Error in createTask route:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
exports.default = router;
