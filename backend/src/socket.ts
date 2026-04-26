import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

interface UserPresence {
    userId: string;
    name: string;
    avatarUrl?: string;
    socketId: string;
}

class SocketService {
    private static instance: SocketService;
    private io: SocketIOServer | null = null;
    private usersByPage: Map<string, Map<string, UserPresence>> = new Map(); // pageId -> Map<userId, UserPresence>

    private constructor() { }

    public static getInstance(): SocketService {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }
        return SocketService.instance;
    }

    public initialize(httpServer: HTTPServer) {
        this.io = new SocketIOServer(httpServer, {
            cors: {
                origin: ['http://localhost:5173', 'http://localhost:5174'],
                methods: ['GET', 'POST'],
                credentials: true,
            },
        });

        this.io.on('connection', (socket) => {
            console.log('Client connected:', socket.id);
            const userId = socket.handshake.query.userId as string;
            if (userId) {
                socket.join(`user-${userId}`);
                console.log(`User ${userId} joined personal room user-${userId}`);
            }

            socket.on('join-page', ({ pageId, user }) => {
                socket.join(pageId);

                if (!this.usersByPage.has(pageId)) {
                    this.usersByPage.set(pageId, new Map());
                }
                const pageUsers = this.usersByPage.get(pageId);
                pageUsers?.set(user.userId, { ...user, socketId: socket.id });

                // Broadcast updated presence to everyone on the page
                this.broadcastPresence(pageId);
            });

            socket.on('leave-page', ({ pageId, userId }) => {
                socket.leave(pageId);
                const users = this.usersByPage.get(pageId);
                if (users) {
                    users.delete(userId);
                    if (users.size === 0) {
                        this.usersByPage.delete(pageId);
                    }
                }
                this.broadcastPresence(pageId);
            });

            socket.on('content-change', ({ pageId, content }) => {
                // Broadcast to everyone in the room except the sender
                socket.to(pageId).emit('content-updated', content);
            });

            socket.on('cursor-change', ({ pageId, cursor, user }) => {
                socket.to(pageId).emit('cursor-updated', { cursor, user });
            });

            // Notion-like Collaborative Cursors
            socket.on('cursor:update', ({ pageId, position, userId, userName, color }) => {
                socket.to(pageId).emit('cursor:updated', {
                    userId,
                    userName,
                    color,
                    position,
                    timestamp: Date.now()
                });
            });

            socket.on('cursor:inactive', ({ pageId, userId }) => {
                socket.to(pageId).emit('cursor:removed', { userId });
            });

            // Workspace Task Events
            socket.on('join-workspace-tasks', (workspaceId) => {
                socket.join(`workspace:${workspaceId}`);
            });

            socket.on('leave-workspace-tasks', (workspaceId) => {
                socket.leave(`workspace:${workspaceId}`);
            });

            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
                // Cleanup user from all pages they were on
                this.usersByPage.forEach((users, pageId) => {
                    users.forEach((u, userId) => {
                        if (u.socketId === socket.id) {
                            users.delete(userId);
                            this.broadcastPresence(pageId);
                        }
                    });
                });
            });
        });
    }

    private broadcastPresence(pageId: string) {
        const users = Array.from(this.usersByPage.get(pageId)?.values() || []);
        this.io?.to(pageId).emit('presence-update', users);
    }

    public broadcastToWorkspace(workspaceId: string, event: string, data: any) {
        this.io?.to(`workspace:${workspaceId}`).emit(event, data);
    }

    public emitNotification(userId: string, notification: any) {
        // Implementation for user-specific notifications
        // Would need a mapping of userId -> socket instances
        this.io?.to(`user-${userId}`).emit('notification', notification);
    }
}

export const socketService = SocketService.getInstance();
