import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { taskApi } from '../api/tasks';
import { CreateTaskInput, Task } from '../types/index';

export type { Task }; 

const SOCKET_URL = 'http://localhost:4000';

interface TaskState {
    tasks: Task[];
    loading: boolean;
    error: string | null;
    socket: Socket | null;
    activeWorkspaceId: string | null;

    fetchTasks: (workspaceId: string) => Promise<void>;
    fetchTaskById: (id: string) => Promise<Task>;
    createTask: (workspaceId: string, data: CreateTaskInput) => Promise<Task>;
    updateTask: (id: string, data: Partial<Task>) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
    moveTask: (id: string, newStatus: string, newPosition: number) => Promise<void>;
    copyTaskToWorkspace: (id: string, targetWorkspaceId: string) => Promise<void>;

    // Real-time workspace subscription
    subscribeToWorkspace: (workspaceId: string) => void;
    unsubscribeFromWorkspace: () => void;

    // Real-time handlers (called by socket listeners)
    handleTaskCreated: (task: Task) => void;
    handleTaskUpdated: (task: Task) => void;
    handleTaskMoved: (payload: { taskId: string; oldStatus: string; newStatus: string; position: number; task: Task }) => void;
    handleTaskDeleted: (payload: { taskId: string }) => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
    tasks: [],
    loading: false,
    error: null,
    socket: null,
    activeWorkspaceId: null,

    fetchTasks: async (workspaceId: string) => {
        set({ loading: true, error: null });
        try {
            const res = await taskApi.getTasks(workspaceId);
            set({ tasks: res.data.data, loading: false });
        } catch (err: any) {
            set({ error: err.message || 'Failed to fetch tasks', loading: false });
        }
    },

    fetchTaskById: async (id: string) => {
        try {
            const res = await taskApi.getTaskById(id);
            return res.data.data;
        } catch (err: any) {
            console.error('Failed to fetch task by id', err);
            throw err;
        }
    },

    createTask: async (workspaceId: string, data: CreateTaskInput) => {
        try {
            const res = await taskApi.createTask(workspaceId, data);
            const newTask = res.data.data;
            // The socket event will handle adding to the list to avoid duplicates,
            // but as a fallback we add it here if socket isn't active.
            set((state) => {
                if (state.tasks.find((t) => t.id === newTask.id)) return state;
                return { tasks: [newTask, ...state.tasks] };
            });
            return newTask;
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to create task';
            set({ error: errorMessage });
            throw err;
        }
    },

    updateTask: async (id: string, data: Partial<Task>) => {
        const oldTasks = [...get().tasks];

        // Optimistic UI
        set((state) => ({
            tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...data } : t)),
        }));

        try {
            const res = await taskApi.updateTask(id, data);
            const updatedTask = res.data.data;
            set((state) => ({
                tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updatedTask } : t)),
            }));
        } catch (err: any) {
            console.error('Failed to update task', err);
            set({ tasks: oldTasks });
            throw err;
        }
    },

    deleteTask: async (id: string) => {
        const oldTasks = [...get().tasks];

        // Optimistic UI
        set((state) => ({
            tasks: state.tasks.filter((t) => t.id !== id),
        }));

        try {
            await taskApi.deleteTask(id);
        } catch (err: any) {
            console.error('Failed to delete task', err);
            set({ tasks: oldTasks });
            throw err;
        }
    },

    moveTask: async (id: string, newStatus: string, newPosition: number) => {
        const oldTasks = [...get().tasks];

        // Optimistic update
        set((state) => ({
            tasks: state.tasks.map((t) =>
                t.id === id ? { ...t, status: newStatus as Task['status'], position: newPosition } : t
            ),
        }));

        try {
            await taskApi.moveTask(id, newStatus, newPosition);
        } catch (err: any) {
            console.error('Failed to move task', err);
            set({ tasks: oldTasks });
            throw err;
        }
    },

    copyTaskToWorkspace: async (id: string, targetWorkspaceId: string) => {
        set({ loading: true, error: null });
        try {
            const res = await taskApi.copyTaskToWorkspace(id, targetWorkspaceId);
            const newTask = res.data.data;
            if (get().activeWorkspaceId === targetWorkspaceId) {
                set((state) => ({ tasks: [newTask, ...state.tasks] }));
            }
            set({ loading: false });
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to copy task';
            set({ error: errorMessage, loading: false });
            throw err;
        }
    },

    // ─── Real-time Subscription ───────────────────────────────────────────────
    subscribeToWorkspace: (workspaceId: string) => {
        const { socket: existingSocket, activeWorkspaceId } = get();

        // Already subscribed to this workspace
        if (existingSocket && activeWorkspaceId === workspaceId) return;

        // Leave old workspace room if switching
        if (existingSocket && activeWorkspaceId) {
            existingSocket.emit('leave-workspace-tasks', activeWorkspaceId);
            existingSocket.off('task:created');
            existingSocket.off('task:updated');
            existingSocket.off('task:moved');
            existingSocket.off('task:deleted');
        }

        let socket = existingSocket;
        if (!socket) {
            socket = io(SOCKET_URL, { withCredentials: true });
            socket.on('connect', () => {
                console.log('[TaskStore] Socket connected:', socket?.id);
            });
            socket.on('disconnect', () => {
                console.log('[TaskStore] Socket disconnected');
            });
        }

        // Join workspace room
        socket.emit('join-workspace-tasks', workspaceId);

        // Register event handlers
        socket.on('task:created', (task: Task) => {
            get().handleTaskCreated(task);
        });
        socket.on('task:updated', (task: Task) => {
            get().handleTaskUpdated(task);
        });
        socket.on('task:moved', (payload: any) => {
            get().handleTaskMoved(payload);
        });
        socket.on('task:deleted', (payload: { taskId: string }) => {
            get().handleTaskDeleted(payload);
        });

        set({ socket, activeWorkspaceId: workspaceId });
    },

    unsubscribeFromWorkspace: () => {
        const { socket, activeWorkspaceId } = get();
        if (!socket) return;

        if (activeWorkspaceId) {
            socket.emit('leave-workspace-tasks', activeWorkspaceId);
        }

        socket.off('task:created');
        socket.off('task:updated');
        socket.off('task:moved');
        socket.off('task:deleted');
        socket.disconnect();

        set({ socket: null, activeWorkspaceId: null });
    },

    // ─── Real-time Handlers ───────────────────────────────────────────────────
    handleTaskCreated: (task: Task) => {
        set((state) => {
            if (state.tasks.find((t) => t.id === task.id)) return state;
            return { tasks: [task, ...state.tasks] };
        });
    },

    handleTaskUpdated: (task: Task) => {
        set((state) => ({
            tasks: state.tasks.map((t) => (t.id === task.id ? { ...t, ...task } : t)),
        }));
    },

    handleTaskMoved: (payload) => {
        set((state) => ({
            tasks: state.tasks.map((t) => (t.id === payload.taskId ? { ...t, ...payload.task } : t)),
        }));
    },

    handleTaskDeleted: (payload) => {
        set((state) => ({
            tasks: state.tasks.filter((t) => t.id !== payload.taskId),
        }));
    },
}));
