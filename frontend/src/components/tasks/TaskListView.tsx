import React from 'react';
import { Task, TaskStatus } from '@/types';
import TaskItem from './TaskItem';

interface TaskListViewProps {
    tasks: Task[];
    onUpdateTask: (id: string, updates: Partial<Task>) => void;
    onSelectTask: (task: Task) => void;
    onDeleteTask: (id: string) => void;
}

const STATUS_GROUPS: { id: TaskStatus; label: string }[] = [
    { id: 'TODO', label: 'To Do' },
    { id: 'IN_PROGRESS', label: 'In Progress' },
    { id: 'REVIEW', label: 'Review' },
    { id: 'DONE', label: 'Done' },
    { id: 'CANCELLED', label: 'Cancelled' },
];

export default function TaskListView({ tasks, onUpdateTask, onSelectTask, onDeleteTask }: TaskListViewProps) {
    if (tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                <p className="text-zinc-500">No tasks found. Create one to get started!</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 mt-4">
            {STATUS_GROUPS.map(({ id, label }) => {
                const groupTasks = tasks.filter((t) => t.status === id).sort((a, b) => a.position - b.position);
                if (groupTasks.length === 0) return null;

                return (
                    <div key={id}>
                        <div className="flex items-center gap-2 mb-2">
                            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{label}</h2>
                            <span className="text-[10px] bg-zinc-200 dark:bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded-full font-bold">
                                {groupTasks.length}
                            </span>
                        </div>
                        <div className="space-y-1 border border-[rgb(var(--border))] rounded-xl overflow-hidden">
                            {groupTasks.map((task) => (
                                <TaskItem
                                    key={task.id}
                                    task={task}
                                    onUpdate={onUpdateTask}
                                    onClick={onSelectTask}
                                    onDelete={onDeleteTask}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
