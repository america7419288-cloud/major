export interface CreateTaskDTO {
  title: string;
  description?: string;
  status?: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'CANCELLED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assigneeId?: string;
  dueDate?: string; // ISO date string
  pageId?: string;
}

export interface TaskResponse {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string | null;
  dueDate: string | null;
  position: number;
  workspaceId: string;
  assigneeId: string | null;
  createdById: string;
  assignee?: {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
  } | null;
  creator: {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
  };
  createdAt: string;
  updatedAt: string;
}
