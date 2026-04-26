import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middlewares/auth.middleware';
import { validateCreateTask } from '../middlewares/validateTask';
import { TaskStatus, Priority } from '@prisma/client';
import { socketService } from '../socket';
import { NotificationController } from '../controllers/NotificationController';
import { emailService } from '../lib/mail';

const router = Router();

/**
 * @route   POST /api/workspaces/:workspaceId/tasks
 * @desc    Create a new task in a workspace.
 *          Supports assigneeEmail: auto-invites the user if not a member,
 *          creates a placeholder account if they don't exist, and sends an email.
 * @access  Authenticated (Workspace Member)
 */
router.post('/workspaces/:workspaceId/tasks', authenticate, validateCreateTask, async (req: AuthRequest, res: Response) => {
  try {
    const { workspaceId } = req.params;
    let { title, description, status, priority, assigneeId, assigneeEmail, dueDate, pageId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const targetWorkspaceId = workspaceId as string;

    // Validate workspace + membership
    const workspace = await prisma.workspace.findFirst({
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
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true }
      });
      const inviterName = currentUser?.name || 'A teammate';

      let assigneeUser = await prisma.user.findUnique({
        where: { email: assigneeEmail }
      });

      if (!assigneeUser) {
        // Create placeholder account (no password — user must sign up later)
        assigneeUser = await prisma.user.create({
          data: {
            email: assigneeEmail,
            name: assigneeEmail.split('@')[0],
          }
        });

        // Auto-add to workspace
        await prisma.workspaceMember.create({
          data: {
            userId: assigneeUser.id,
            workspaceId: targetWorkspaceId,
            role: 'MEMBER'
          }
        });

        // Send invitation email
        try {
          await emailService.sendInvitationEmail(assigneeEmail, workspace.name, title, inviterName);
        } catch (emailErr) {
          console.error('Failed to send invitation email:', emailErr);
        }
      } else {
        // Check existing membership
        const isMember = await prisma.workspaceMember.findUnique({
          where: { userId_workspaceId: { userId: assigneeUser.id, workspaceId: targetWorkspaceId } }
        });

        if (!isMember) {
          await prisma.workspaceMember.create({
            data: {
              userId: assigneeUser.id,
              workspaceId: targetWorkspaceId,
              role: 'MEMBER'
            }
          });
          try {
            await emailService.sendInvitationEmail(assigneeEmail, workspace.name, title, inviterName);
          } catch (emailErr) {
            console.error('Failed to send invitation email:', emailErr);
          }
        } else if (assigneeUser.id !== userId) {
          try {
            await emailService.sendAssignmentNotification(assigneeEmail, title, inviterName);
          } catch (emailErr) {
            console.error('Failed to send assignment email:', emailErr);
          }
        }
      }

      assigneeId = assigneeUser.id;
    }
    // ─────────────────────────────────────────────────────────────────────────

    // Determine status
    const taskStatus = (status?.toUpperCase() || 'TODO') as TaskStatus;

    // Calculate position (append to bottom of column)
    const maxPosition = await prisma.task.findFirst({
      where: { workspaceId: targetWorkspaceId, status: taskStatus },
      orderBy: { position: 'desc' },
      select: { position: true }
    });
    const position = (maxPosition?.position ?? -1) + 1;

    // Create the task
    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        status: taskStatus,
        priority: (priority?.toUpperCase() || 'MEDIUM') as Priority,
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
    socketService.broadcastToWorkspace(targetWorkspaceId, 'task:created', task);

    // In-app notification for assignee
    if (assigneeId && assigneeId !== userId) {
      try {
        await NotificationController.createNotification({
          userId: assigneeId,
          type: 'ASSIGNMENT',
          title: `You were assigned a task: ${task.title}`,
          content: 'A new task has been assigned to you.',
          link: `/tasks?taskId=${task.id}`
        });
      } catch (notifErr) {
        // Non-fatal — log but don't fail the request
        console.error('Failed to create notification:', notifErr);
      }
    }

    return res.status(201).json({ data: task });
  } catch (error) {
    console.error('Error in createTask route:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
