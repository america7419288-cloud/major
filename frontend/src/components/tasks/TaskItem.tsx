import React from 'react';
import { MoreHorizontal, Calendar, CheckCircle2, Circle, Trash2 } from 'lucide-react';
import { Task } from '@/types';
import TaskStatusBadge from './TaskStatusBadge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface TaskItemProps {
    task: Task;
    onUpdate: (id: string, updates: Partial<Task>) => void;
    onClick: (task: Task) => void;
    onDelete?: (id: string) => void;
}

export default function TaskItem({ task, onUpdate, onClick, onDelete }: TaskItemProps) {
    const toggleDone = (e: React.MouseEvent) => {
        e.stopPropagation();
        onUpdate(task.id, { status: task.status === 'DONE' ? 'TODO' : 'DONE' });
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete?.(task.id);
    };

    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';

    return (
        <div
            onClick={() => onClick(task)}
            className="group flex items-center gap-3 px-4 py-3 bg-[rgb(var(--surface))] hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors border-b border-[rgb(var(--border))] last:border-b-0"
        >
            {/* Done Toggle */}
            <button
                onClick={toggleDone}
                className={cn(
                    'flex-shrink-0 transition-colors',
                    task.status === 'DONE' ? 'text-emerald-500' : 'text-zinc-300 group-hover:text-zinc-400'
                )}
            >
                {task.status === 'DONE' ? <CheckCircle2 size={16} /> : <Circle size={16} />}
            </button>

            {/* Title & Meta */}
            <div className="flex-grow min-w-0">
                <h3
                    className={cn(
                        'text-sm font-medium truncate',
                        task.status === 'DONE' && 'line-through text-zinc-400'
                    )}
                >
                    {task.title}
                </h3>

                <div className="flex items-center gap-2 mt-0.5">
                    <TaskStatusBadge status={task.status} />

                    {task.dueDate && (
                        <div
                            className={cn(
                                'flex items-center gap-1 text-[10px]',
                                isOverdue ? 'text-red-500 font-medium' : 'text-zinc-400'
                            )}
                        >
                            <Calendar size={10} />
                            {format(new Date(task.dueDate), 'MMM d')}
                            {isOverdue && ' · Overdue'}
                        </div>
                    )}

                    {task.priority && (
                        <span
                            className={cn(
                                'text-[10px] font-semibold px-1.5 py-0.5 rounded',
                                task.priority === 'URGENT' ? 'text-red-600 bg-red-100 dark:bg-red-900/30' :
                                task.priority === 'HIGH' ? 'text-red-500 bg-red-100 dark:bg-red-900/20' :
                                task.priority === 'MEDIUM' ? 'text-amber-500 bg-amber-100 dark:bg-amber-900/20' :
                                'text-zinc-400 bg-zinc-100 dark:bg-zinc-800'
                            )}
                        >
                            {task.priority}
                        </span>
                    )}
                </div>
            </div>

            {/* Assignee avatar */}
            {task.assignee && (
                <div className="flex-shrink-0">
                    {task.assignee.avatar ? (
                        <img
                            src={task.assignee.avatar}
                            alt={task.assignee.name || ''}
                            className="w-6 h-6 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] text-white font-bold">
                            {(task.assignee.name || 'U').charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
            )}

            {/* Actions */}
            <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {onDelete && (
                    <button
                        onClick={handleDelete}
                        className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Delete task"
                    >
                        <Trash2 size={14} />
                    </button>
                )}
                <button className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors">
                    <MoreHorizontal size={14} />
                </button>
            </div>
        </div>
    );
}
