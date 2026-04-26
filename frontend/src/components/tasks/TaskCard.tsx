import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '@/types';
import { cn } from '@/lib/utils';
import { Calendar, CheckCircle2, Circle, Trash2, User } from 'lucide-react';
import { format } from 'date-fns';

interface TaskCardProps {
    task: Task;
    index: number;
    onClick: (task: Task) => void;
    onDelete?: (id: string) => void;
}

const PRIORITY_STYLES: Record<string, string> = {
    URGENT: 'text-red-600 bg-red-100 dark:bg-red-900/30',
    HIGH: 'text-red-500 bg-red-100 dark:bg-red-900/20',
    MEDIUM: 'text-amber-500 bg-amber-100 dark:bg-amber-900/20',
    LOW: 'text-zinc-400 bg-zinc-100 dark:bg-zinc-800',
};

const PRIORITY_DOT: Record<string, string> = {
    URGENT: 'bg-red-600',
    HIGH: 'bg-red-500',
    MEDIUM: 'bg-amber-400',
    LOW: 'bg-zinc-400',
};

export default function TaskCard({ task, onClick, onDelete }: TaskCardProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: task.id,
        data: task,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete?.(task.id);
    };

    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={() => onClick(task)}
            className={cn(
                'group bg-[rgb(var(--surface))] p-3 mb-2 rounded-lg border border-[rgb(var(--border))] shadow-sm select-none cursor-grab active:cursor-grabbing transition-all',
                isDragging ? 'shadow-xl ring-2 ring-blue-500/40 scale-[1.02]' : 'hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-md'
            )}
        >
            {/* Title Row */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                    <div className="flex-shrink-0 mt-0.5 text-zinc-300">
                        {task.status === 'DONE' ? (
                            <CheckCircle2 size={14} className="text-emerald-500" />
                        ) : (
                            <Circle size={14} className="text-zinc-300" />
                        )}
                    </div>
                    <h4
                        className={cn(
                            'text-sm font-medium line-clamp-2 leading-snug',
                            task.status === 'DONE' && 'line-through text-zinc-400'
                        )}
                    >
                        {task.title}
                    </h4>
                </div>

                {/* Delete button — shown on hover */}
                {onDelete && (
                    <button
                        onClick={handleDelete}
                        className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-0.5 text-zinc-300 hover:text-red-500 rounded transition-all"
                        title="Delete task"
                    >
                        <Trash2 size={12} />
                    </button>
                )}
            </div>

            {/* Meta Row */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                {task.priority && (
                    <div className="flex items-center gap-1">
                        <div className={cn('w-1.5 h-1.5 rounded-full', PRIORITY_DOT[task.priority])} />
                        <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider', PRIORITY_STYLES[task.priority])}>
                            {task.priority}
                        </span>
                    </div>
                )}

                {task.dueDate && (
                    <div
                        className={cn(
                            'flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded',
                            isOverdue
                                ? 'text-red-500 bg-red-50 dark:bg-red-900/20'
                                : 'text-zinc-400'
                        )}
                    >
                        <Calendar size={10} />
                        {format(new Date(task.dueDate), 'MMM d')}
                    </div>
                )}

                {task.assignee && (
                    <div className="ml-auto flex items-center gap-1 text-[10px] text-zinc-400">
                        {task.assignee.avatar ? (
                            <img
                                src={task.assignee.avatar}
                                alt={task.assignee.name || ''}
                                className="w-4 h-4 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-[8px] text-white font-bold">
                                {(task.assignee.name || 'U').charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
