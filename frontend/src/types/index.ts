// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface User {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
    bio?: string | null;
    createdAt?: string;
}

export interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
}

// ─── Workspace ────────────────────────────────────────────────────────────────
export interface Workspace {
    id: string;
    name: string;
    icon?: string;
    description?: string;
    ownerId: string;
    createdAt: string;
    updatedAt: string;
    role?: Role;
    pages?: Page[];
    members?: WorkspaceMember[];
}

export type Role = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export interface WorkspaceMember {
    id: string;
    userId: string;
    workspaceId: string;
    role: Role;
    user: User;
    joinedAt: string;
}

// ─── Pages ────────────────────────────────────────────────────────────────────
export interface Page {
    id: string;
    workspaceId: string;
    parentId?: string;
    title: string;
    icon?: string;
    coverImage?: string;
    content: any; // Can be string (HTML) or BlockContent[] (JSON)
    createdById: string;
    updatedById?: string;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string;
    position: number;
    isFavorite: boolean;
    children?: Page[];
    creator?: User;
    fontStyle?: 'default' | 'serif' | 'mono';
    isFullWidth?: boolean;
    isSmallText?: boolean;
    isPublic?: boolean;
    publicPermission?: 'FULL_ACCESS' | 'CAN_EDIT' | 'CAN_COMMENT' | 'CAN_VIEW';
    _count?: {
        permissions: number;
    };
}

export interface BlockContent {
    type: string;
    content?: any;
    attrs?: Record<string, any>;
    marks?: any[];
    text?: string;
}

// ─── Tasks ────────────────────────────────────────────────────────────────────
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'CANCELLED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | null;

export interface Task {
    id: string;
    workspaceId: string;
    pageId?: string;
    parentId?: string;
    title: string;
    description?: any;
    status: TaskStatus;
    progress?: number;
    dueDate?: string | null;
    startDate?: string | null;
    completedAt?: string | null;
    priority: Priority;
    tags?: string[];
    position: number;
    assigneeId: string | null;
    assignee?: User | null;
    createdById: string;
    creator?: User;
    estimatedTime?: number;
    trackedTime?: number;
    recurringPattern?: string;
    subtasks?: Task[];
    createdAt: string;
    updatedAt: string;
    deletedAt?: string;
    comments?: Comment[];
    activities?: any[];
}

export interface CreateTaskInput {
    title: string;
    description?: any;
    status?: TaskStatus;
    priority?: Priority;
    assigneeId?: string;
    assigneeEmail?: string;
    dueDate?: string;
    pageId?: string;
}

export interface TaskFilters {
    status?: TaskStatus[];
    priority?: Priority[];
    assigneeId?: string;
    tags?: string[];
    dueDateFrom?: string;
    dueDateTo?: string;
    search?: string;
}

// ─── Database ─────────────────────────────────────────────────────────────────
export type PropertyType =
    | 'TITLE' | 'TEXT' | 'NUMBER' | 'SELECT' | 'MULTI_SELECT' | 'STATUS'
    | 'DATE' | 'DATETIME' | 'PERSON' | 'CHECKBOX' | 'URL' | 'EMAIL' | 'PHONE'
    | 'FILE' | 'PERCENT' | 'RATING' | 'FORMULA' | 'RELATION' | 'ROLLUP'
    | 'CREATED_TIME' | 'CREATED_BY' | 'LAST_EDITED_TIME';

export type ViewType = 'TABLE' | 'BOARD' | 'LIST' | 'CALENDAR' | 'TIMELINE' | 'GALLERY';

export interface PropertyDef {
    id: string;
    name: string;
    type: PropertyType;
    options?: string[];
    formula?: string;
    width?: number;
}

export interface Database {
    id: string;
    workspaceId: string;
    pageId?: string;
    title: string;
    icon?: string;
    description?: string;
    schema: PropertyDef[];
    views: DatabaseView[];
    items: DatabaseItem[];
    createdAt: string;
    updatedAt: string;
}

export interface DatabaseItem {
    id: string;
    databaseId: string;
    properties: Record<string, any>;
    position: number;
    createdAt: string;
    updatedAt: string;
}

export interface DatabaseView {
    id: string;
    databaseId: string;
    name: string;
    type: ViewType;
    config: ViewConfig;
    position: number;
}

export interface ViewConfig {
    filters?: FilterRule[];
    sorts?: SortRule[];
    groupBy?: string;
    hiddenProperties?: string[];
}

export interface FilterRule {
    propertyId: string;
    operator: string;
    value: any;
}

export interface SortRule {
    propertyId: string;
    direction: 'asc' | 'desc';
}

// ─── Comments ─────────────────────────────────────────────────────────────────
export interface Comment {
    id: string;
    userId: string;
    user: User;
    entityType: string;
    entityId: string;
    content: string;
    parentId?: string;
    anchorText?: string;
    blockSnapshot?: any;
    resolvedAt?: string | null;
    replies?: Comment[];
    createdAt: string;
    updatedAt: string;
}

// ─── Notification ─────────────────────────────────────────────────────────────
export interface Notification {
    id: string;
    userId: string;
    type: 'COMMENT_REPLY' | 'MENTION' | 'ASSIGNMENT' | string;
    title: string;
    content: string;
    link?: string;
    isRead: boolean;
    createdAt: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
    data: T;
    message?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// ─── UI ───────────────────────────────────────────────────────────────────────
export interface UIState {
    sidebarCollapsed: boolean;
    theme: 'light' | 'dark' | 'system';
    activeWorkspaceId: string | null;
    commandPaletteOpen: boolean;
    rightPanelOpen: boolean;
}
