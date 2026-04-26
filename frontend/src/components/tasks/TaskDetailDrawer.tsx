import React, { useState, useEffect, useMemo } from 'react';
import { useWorkspaceStore, useUIStore, useAuthStore } from '@/store';
import { X, Calendar, Flag, User, Trash2, CheckCircle2, Lock, Plus } from 'lucide-react';
import { Task, TaskStatus, Priority } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import TaskStatusBadge from './TaskStatusBadge';
import CommentSection from '../collaboration/CommentSection';
import { taskApi } from '@/api/tasks';
import { formatDistanceToNow } from 'date-fns';
import TaskEditor from './TaskEditor';
import { toast } from 'sonner';

interface TaskDetailDrawerProps {
    task: Task | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (id: string, updates: Partial<Task>) => void;
    onDelete: (id: string) => Promise<void> | void;
}

export default function TaskDetailDrawer({ task, isOpen, onClose, onUpdate, onDelete }: TaskDetailDrawerProps) {
    const { workspaces } = useWorkspaceStore();
    const { activeWorkspaceId } = useUIStore();
    const { user } = useAuthStore();
    const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) as any;
    
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [fullTask, setFullTask] = useState<Task | null>(null);
    const [activeTab, setActiveTab] = useState<'comments' | 'activity'>('comments');

    const restrictions = useMemo(() => {
        if (!task || !user) return { isRestricted: false, canDelete: true, canEditTitle: true, canEditAssignee: true };
        
        const member = currentWorkspace?.members?.find((m: any) => m.userId === user.id);
        const role = member?.role || 'MEMBER';
        const isCreator = task.createdById === user.id;
        const isAdmin = role === 'ADMIN' || role === 'OWNER';
        const isAssignee = task.assigneeId === user.id;

        const isRestricted = isAssignee && !isCreator && !isAdmin;

        return {
            isRestricted,
            canDelete: isCreator || isAdmin,
            canEditTitle: !isRestricted,
            canEditAssignee: !isRestricted,
        };
    }, [task, user, currentWorkspace]);

    useEffect(() => {
        if (task && isOpen) {
            setTitle(task.title);
            setDescription(task.description || '');
            
            // Fetch full task data
            taskApi.getTaskById(task.id).then(res => {
                setFullTask(res.data.data);
            }).catch(console.error);
        } else {
            setFullTask(null);
            setActiveTab('comments');
        }
    }, [task, isOpen]);

    if (!task) return null;

    const handleUpdate = (updates: Partial<Task>) => {
        onUpdate(task.id, updates);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]"
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-[720px] bg-[rgb(var(--background))] border-l border-[rgb(var(--border))] shadow-2xl z-[101] flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-[rgb(var(--border))]">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleUpdate({ status: task.status === 'DONE' ? 'TODO' : 'DONE' })}
                                    className={cn(
                                        "p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors",
                                        task.status === 'DONE' ? "text-emerald-500" : "text-zinc-400"
                                    )}
                                >
                                    <CheckCircle2 size={20} />
                                </button>
                                <TaskStatusBadge status={task.status} />
                                {restrictions.isRestricted && (
                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-md text-[10px] font-bold uppercase tracking-wider border border-amber-200/50 dark:border-amber-800/50">
                                        <Lock size={12} />
                                        Restricted Access
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        const targetId = prompt('Enter Workspace ID to copy to:');
                                        if (targetId) {
                                            taskApi.copyTaskToWorkspace(task.id, targetId)
                                                .then(() => toast.success('Task copied successfully'))
                                                .catch(err => toast.error('Failed to copy task'));
                                        }
                                    }}
                                    className="p-2 text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                    title="Copy to Workspace"
                                >
                                    <Plus size={18} />
                                </button>
                                {restrictions.canDelete && (
                                    <button
                                        onClick={() => {
                                            onDelete(task.id);
                                            onClose();
                                        }}
                                        className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                        title="Delete Task"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    className="p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-grow overflow-y-auto p-8 md:px-12 space-y-8">
                            <textarea
                                value={title}
                                onChange={(e) => {
                                    if (restrictions.canEditTitle) {
                                        setTitle(e.target.value);
                                        handleUpdate({ title: e.target.value });
                                    }
                                }}
                                readOnly={!restrictions.canEditTitle}
                                className={cn(
                                    "w-full text-4xl font-bold bg-transparent border-none outline-none resize-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700 leading-tight",
                                    !restrictions.canEditTitle && "cursor-default select-none"
                                )}
                                placeholder="Untitled"
                                rows={1}
                                onInput={(e) => {
                                    const target = e.target as HTMLTextAreaElement;
                                    target.style.height = 'auto';
                                    target.style.height = `${target.scrollHeight}px`;
                                }}
                            />

                            <div className="space-y-3 py-2">
                                <div className="grid grid-cols-[140px_1fr] items-center gap-4 group">
                                    <div className="flex items-center gap-2 text-sm text-zinc-500 font-medium select-none">
                                        <div className="w-4 h-4 flex items-center justify-center">
                                            <CheckCircle2 size={16} className="text-zinc-400" />
                                        </div>
                                        Status
                                    </div>
                                    <div>
                                        <select
                                            value={task.status}
                                            onChange={(e) => handleUpdate({ status: e.target.value as TaskStatus })}
                                            className="bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 border-none rounded px-2 py-1 -ml-2 text-sm outline-none transition-colors cursor-pointer w-auto"
                                        >
                                            <option value="TODO">To Do</option>
                                            <option value="IN_PROGRESS">In Progress</option>
                                            <option value="IN_REVIEW">In Review</option>
                                            <option value="DONE">Done</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-[140px_1fr] items-center gap-4 group">
                                    <div className="flex items-center gap-2 text-sm text-zinc-500 font-medium select-none">
                                        <div className="w-4 h-4 flex items-center justify-center">
                                            <Flag size={16} className="text-zinc-400" />
                                        </div>
                                        Priority
                                    </div>
                                    <div>
                                        <select
                                            value={task.priority || ''}
                                            onChange={(e) => handleUpdate({ priority: e.target.value as Priority })}
                                            className="bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 border-none rounded px-2 py-1 -ml-2 text-sm outline-none transition-colors cursor-pointer w-auto"
                                        >
                                            <option value="LOW">Low</option>
                                            <option value="MEDIUM">Medium</option>
                                            <option value="HIGH">High</option>
                                            <option value="URGENT">Urgent</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-[140px_1fr] items-center gap-4 group">
                                    <div className="flex items-center gap-2 text-sm text-zinc-500 font-medium select-none">
                                        <div className="w-4 h-4 flex items-center justify-center">
                                            <Calendar size={16} className="text-zinc-400" />
                                        </div>
                                        Due Date
                                    </div>
                                    <div>
                                        <input
                                            type="date"
                                            value={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
                                            onChange={(e) => handleUpdate({ dueDate: e.target.value || undefined })}
                                            className="bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 border-none rounded px-2 py-1 -ml-2 text-sm outline-none transition-colors cursor-pointer w-auto text-zinc-700 dark:text-zinc-300"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-[140px_1fr] items-center gap-4 group">
                                    <div className="flex items-center gap-2 text-sm text-zinc-500 font-medium select-none">
                                        <div className="w-4 h-4 flex items-center justify-center">
                                            <User size={16} className="text-zinc-400" />
                                        </div>
                                        Assignee
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={task.assigneeId || ''}
                                            onChange={(e) => {
                                                if (restrictions.canEditAssignee) {
                                                    handleUpdate({ assigneeId: e.target.value || undefined });
                                                }
                                            }}
                                            disabled={!restrictions.canEditAssignee}
                                            className={cn(
                                                "bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 border-none rounded px-2 py-1 -ml-2 text-sm outline-none transition-colors cursor-pointer w-auto max-w-[150px]",
                                                !restrictions.canEditAssignee && "cursor-not-allowed opacity-70"
                                            )}
                                        >
                                            <option value="">Empty</option>
                                            {currentWorkspace?.members?.map((member: any) => (
                                                <option key={member.userId} value={member.userId}>
                                                    {member.user?.name || member.user?.email}
                                                </option>
                                            ))}
                                            {/* Fallback for invited users not yet in member list */}
                                            {task.assignee && !currentWorkspace?.members?.some((m: any) => m.userId === task.assigneeId) && (
                                                <option value={task.assigneeId!}>
                                                    {task.assignee.name || task.assignee.email} (Invited)
                                                </option>
                                            )}
                                        </select>
                                        {restrictions.canEditAssignee && (
                                            <>
                                                <span className="text-zinc-500 text-xs">or</span>
                                                <input
                                                    type="email"
                                                    placeholder="Enter email to assign"
                                                    className="bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 border-none rounded px-2 py-1 text-sm outline-none transition-colors w-[200px] placeholder:text-zinc-500"
                                                    onBlur={(e) => {
                                                        if (e.target.value) {
                                                            handleUpdate({ assigneeEmail: e.target.value } as any);
                                                            e.target.value = ''; // clear after submission
                                                        }
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            if (e.currentTarget.value) {
                                                                handleUpdate({ assigneeEmail: e.currentTarget.value } as any);
                                                                e.currentTarget.value = '';
                                                            }
                                                        }
                                                    }}
                                                />
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6">
                                <TaskEditor 
                                    key={task.id} 
                                    initialContent={description} 
                                    onChange={(content) => handleUpdate({ description: content })} 
                                />

                                <div className="space-y-4 mt-12 border-t border-[rgb(var(--border))] pt-8">
                                    <div className="flex border-b border-[rgb(var(--border))]">
                                        <button 
                                            onClick={() => setActiveTab('comments')}
                                            className={cn(
                                                "px-4 py-2 text-sm font-semibold tracking-wider transition-colors border-b-2",
                                                activeTab === 'comments' ? "border-blue-500 text-blue-500" : "border-transparent text-zinc-500 hover:text-zinc-300"
                                            )}
                                        >
                                            Comments
                                        </button>
                                        <button 
                                            onClick={() => setActiveTab('activity')}
                                            className={cn(
                                                "px-4 py-2 text-sm font-semibold tracking-wider transition-colors border-b-2",
                                                activeTab === 'activity' ? "border-blue-500 text-blue-500" : "border-transparent text-zinc-500 hover:text-zinc-300"
                                            )}
                                        >
                                            Activity
                                        </button>
                                    </div>
                                    
                                    <div className="bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl border border-[rgb(var(--border))] min-h-[300px]">
                                        {activeTab === 'comments' ? (
                                            <CommentSection
                                                entityType="TASK"
                                                entityId={task.id}
                                            />
                                        ) : (
                                            <div className="p-4 space-y-4">
                                                {!fullTask?.activities || fullTask.activities.length === 0 ? (
                                                    <div className="text-center text-sm text-zinc-500 py-8">No activity yet</div>
                                                ) : (
                                                    fullTask.activities.map((activity: any) => (
                                                        <div key={activity.id} className="flex gap-3 text-sm">
                                                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0 text-xs">
                                                                {activity.user?.name?.charAt(0) || '?'}
                                                            </div>
                                                            <div>
                                                                <p className="text-zinc-300">
                                                                    <span className="font-semibold text-zinc-100">{activity.user?.name} </span>
                                                                    {activity.action === 'created' ? 'created this task' :
                                                                     activity.action === 'updated' ? 'updated this task' :
                                                                     activity.action === 'status_changed' ? `changed status to ${activity.details?.to}` :
                                                                     activity.action}
                                                                </p>
                                                                <p className="text-xs text-zinc-500">
                                                                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
