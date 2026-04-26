import React from 'react';
import { cn } from '@/lib/utils';
import { TaskStatus } from '@/types';

interface TaskStatusBadgeProps {
    status: TaskStatus;
    className?: string;
}

const statusConfig: Record<TaskStatus, { label: string; color: string }> = {
    TODO: { label: 'To Do', color: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' },
    IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
    REVIEW: { label: 'Review', color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
    DONE: { label: 'Done', color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
    CANCELLED: { label: 'Cancelled', color: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' },
};

export default function TaskStatusBadge({ status, className }: TaskStatusBadgeProps) {
    const config = statusConfig[status] || statusConfig.TODO;

    return (
        <span className={cn(
            'px-2 py-0.5 rounded text-xs font-medium inline-block',
            config.color,
            className
        )}>
            {config.label}
        </span>
    );
}
