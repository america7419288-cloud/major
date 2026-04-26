import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTaskStore } from '@/store/task.store';
import { useUIStore, useWorkspaceStore } from '@/store';
import { toast } from 'sonner';
import { LayoutList, LayoutGrid, Plus, Filter, SortDesc, Download, ClipboardList } from 'lucide-react';
import TaskListView from '@/components/tasks/TaskListView';
import TaskBoardView from '@/components/tasks/TaskBoardView';
import TaskDetailDrawer from '@/components/tasks/TaskDetailDrawer';
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal';
import { TaskAssignmentPopup } from '@/components/tasks/TaskAssignmentPopup';
import { Task, TaskStatus } from '@/types';
import { cn } from '@/lib/utils';
import { ListSkeleton } from '@/components/ui/SkeletonLoader';
import EmptyState from '@/components/ui/EmptyState';


export default function TasksPage() {
    const { activeWorkspaceId, setActiveWorkspace } = useUIStore();
    const { tasks, loading, fetchTasks, updateTask, deleteTask, subscribeToWorkspace, unsubscribeFromWorkspace, fetchTaskById, copyTaskToWorkspace } = useTaskStore();
    const { workspaces } = useWorkspaceStore();
    const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
    
    const [view, setView] = useState<'list' | 'board'>('board');
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('TODO');
    const [searchParams, setSearchParams] = useSearchParams();

    // Assignment Popup State
    const [showAssignmentPopup, setShowAssignmentPopup] = useState(false);
    const [pendingTask, setPendingTask] = useState<Task | null>(null);

    useEffect(() => {
        if (currentWorkspace?.id) {
            fetchTasks(currentWorkspace.id);
            subscribeToWorkspace(currentWorkspace.id);
        }

        return () => {
            unsubscribeFromWorkspace();
        };
    }, [currentWorkspace?.id]);

    useEffect(() => {
        const checkTaskFromUrl = async () => {
            const taskId = searchParams.get('taskId');
            if (!taskId) return;

            // Check if task is already in current workspace
            const existingTask = tasks.find(t => t.id === taskId);
            if (existingTask) {
                setSelectedTask(existingTask);
                setIsDrawerOpen(true);
                return;
            }

            // If not in current workspace, fetch it
            try {
                const task = await fetchTaskById(taskId);
                if (task) {
                    if (task.workspaceId !== activeWorkspaceId) {
                        setPendingTask(task);
                        setShowAssignmentPopup(true);
                    } else {
                        setSelectedTask(task);
                        setIsDrawerOpen(true);
                    }
                }
            } catch (err) {
                console.error('Failed to load task from URL', err);
            }
        };

        if (activeWorkspaceId) {
            checkTaskFromUrl();
        }
    }, [searchParams, activeWorkspaceId, tasks.length]); // Re-run when tasks load or URL changes

    const handleGoToTaskWorkspace = () => {
        if (pendingTask) {
            setActiveWorkspace(pendingTask.workspaceId);
            setShowAssignmentPopup(false);
            setPendingTask(null);
            toast.success('Switched to workspace');
        }
    };

    const handleAddToCurrentWorkspace = async () => {
        if (pendingTask && activeWorkspaceId) {
            try {
                await copyTaskToWorkspace(pendingTask.id, activeWorkspaceId);
                setShowAssignmentPopup(false);
                setPendingTask(null);
                toast.success('Task added to your workspace');
            } catch (err) {
                toast.error('Failed to add task to workspace');
            }
        }
    };

    const handleAddTask = (status: TaskStatus = 'TODO') => {
        if (!currentWorkspace?.id) {
            toast.error('Please select a workspace first');
            return;
        }
        setDefaultStatus(status);
        setIsCreateModalOpen(true);
    };

    const handleSelectTask = (task: Task) => {
        setSelectedTask(task);
        setIsDrawerOpen(true);
        setSearchParams({ taskId: task.id });
    };

    const handleCloseDrawer = () => {
        setIsDrawerOpen(false);
        setSelectedTask(null);
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('taskId');
        setSearchParams(newParams);
    };

    const handleDeleteTask = async (id: string) => {
        await deleteTask(id);
        if (selectedTask?.id === id) {
            setIsDrawerOpen(false);
            setSelectedTask(null);
        }
        toast.success('Task deleted');
    };

    const handleExportCSV = () => {
        if (tasks.length === 0) return;

        const headers = ['Title', 'Status', 'Priority', 'Due Date', 'Created At'];
        const rows = tasks.map(task => [
            `"${task.title.replace(/"/g, '""')}"`,
            task.status,
            task.priority || 'MEDIUM',
            task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '',
            new Date(task.createdAt).toLocaleDateString()
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `tasks_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex flex-col h-full bg-[rgb(var(--background))]">
            {/* Header */}
            <div className="px-8 py-6 border-b border-[rgb(var(--border))] flex items-center justify-between bg-[rgb(var(--background))] sticky top-0 z-10">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
                    <p className="text-sm text-zinc-500 mt-1">
                        {currentWorkspace ? `${currentWorkspace.name} · ` : ''}Manage and track your work across the workspace.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
                        <button
                            onClick={() => setView('list')}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                                view === 'list' ? "bg-[rgb(var(--surface))] text-[rgb(var(--text-primary))] shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                            )}
                        >
                            <LayoutList size={16} />
                            List
                        </button>
                        <button
                            onClick={() => setView('board')}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                                view === 'board' ? "bg-[rgb(var(--surface))] text-[rgb(var(--text-primary))] shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                            )}
                        >
                            <LayoutGrid size={16} />
                            Board
                        </button>
                    </div>

                    <div className="h-6 w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-1" />

                    <button
                        onClick={handleExportCSV}
                        className="p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        title="Export as CSV"
                    >
                        <Download size={18} />
                    </button>
                    <button className="p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                        <Filter size={18} />
                    </button>
                    <button className="p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                        <SortDesc size={18} />
                    </button>

                    <button
                        onClick={() => handleAddTask()}
                        className="ml-2 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-lg hover:shadow-blue-500/20 active:scale-95"
                    >
                        <Plus size={18} />
                        New Task
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-grow overflow-auto">
                <div className={cn(
                    "max-w-7xl mx-auto px-8 pb-20",
                    view === 'board' && "max-w-none px-0"
                )}>
                    {loading && tasks.length === 0 ? (
                        <ListSkeleton />
                    ) : !currentWorkspace ? (
                        <EmptyState
                            title="No workspace selected"
                            description="Select or create a workspace from the sidebar to see your tasks."
                            icon={ClipboardList}
                            className="mt-20"
                        />
                    ) : tasks.length === 0 && view === 'list' ? (
                        <EmptyState
                            title="No tasks yet"
                            description="Keep track of your work by adding your first task. Organize with statuses and priorities."
                            icon={ClipboardList}
                            action={{
                                label: "Create Task",
                                onClick: () => handleAddTask()
                            }}
                            className="mt-20"
                        />
                    ) : (
                        view === 'list' ? (
                            <TaskListView
                                tasks={tasks}
                                onUpdateTask={updateTask}
                                onSelectTask={handleSelectTask}
                                onDeleteTask={handleDeleteTask}
                            />
                        ) : (
                            <TaskBoardView
                                tasks={tasks}
                                onUpdateTask={updateTask}
                                onSelectTask={handleSelectTask}
                                onAddTask={handleAddTask}
                                onDeleteTask={handleDeleteTask}
                            />
                        )
                    )}
                </div>
            </div>

            {/* Task Detail Drawer */}
            <TaskDetailDrawer
                isOpen={isDrawerOpen}
                onClose={handleCloseDrawer}
                task={selectedTask}
                onUpdate={updateTask}
                onDelete={handleDeleteTask}
            />

            <CreateTaskModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                defaultStatus={defaultStatus}
            />

            {pendingTask && (
                <TaskAssignmentPopup
                    isOpen={showAssignmentPopup}
                    onClose={() => {
                        setShowAssignmentPopup(false);
                        setPendingTask(null);
                    }}
                    task={pendingTask}
                    workspaceName={workspaces.find(w => w.id === pendingTask.workspaceId)?.name || 'Another'}
                    onGoToWorkspace={handleGoToTaskWorkspace}
                    onAddToCurrentWorkspace={handleAddToCurrentWorkspace}
                />
            )}
        </div>
    );
}
