import api from '../lib/api';
import { CreateTaskInput, Task } from '../types/index';

export type { CreateTaskInput };

export const taskApi = {
    getTasks: (workspaceId: string, params?: { status?: string; assigneeId?: string; pageId?: string }) => {
        return api.get('/tasks', { params: { workspaceId, ...params } });
    },

    getTaskById: (id: string) => {
        return api.get(`/tasks/${id}`);
    },

    createTask: (workspaceId: string, data: CreateTaskInput) => {
        return api.post(`/workspaces/${workspaceId}/tasks`, data);
    },

    updateTask: (id: string, data: Partial<Task>) => {
        return api.put(`/tasks/${id}`, data);
    },

    deleteTask: (id: string) => {
        return api.delete(`/tasks/${id}`);
    },

    moveTask: (id: string, newStatus: string, position: number) => {
        return api.post(`/tasks/${id}/move`, { newStatus, position });
    },

    copyTaskToWorkspace: (id: string, targetWorkspaceId: string) => {
        return api.post(`/tasks/${id}/copy`, { targetWorkspaceId });
    },
};
