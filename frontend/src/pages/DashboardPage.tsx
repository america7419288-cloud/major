import React, { useState } from 'react';
import { useWorkspaceStore, useAuthStore, useUIStore } from '@/store';
import { Loader2, Plus, Settings, Folder } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function DashboardPage() {
    const { workspaces, loading, error, createWorkspace } = useWorkspaceStore();
    const { user } = useAuthStore();
    const { setActiveWorkspace } = useUIStore();
    const navigate = useNavigate();

    const [isCreating, setIsCreating] = useState(false);
    const [newWorkspaceName, setNewWorkspaceName] = useState('');

    const handleCreateWorkspace = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newWorkspaceName.trim()) return;
        
        setIsCreating(true);
        try {
            await createWorkspace({ name: newWorkspaceName, icon: '🚀' });
            setNewWorkspaceName('');
        } catch (err) {
            // Error handled by store
        } finally {
            setIsCreating(false);
        }
    };

    const handleSelectWorkspace = (id: string) => {
        setActiveWorkspace(id);
        toast.success('Workspace selected');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-[rgb(var(--text-muted))]" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-destructive">
                <p>Failed to load workspaces.</p>
                <p className="text-sm opacity-80">{error}</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-5xl mx-auto h-full flex flex-col">
            <header className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name || 'Explorer'}</h1>
                    <p className="text-[rgb(var(--text-muted))]">Manage your workspaces and productivity.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {/* Create New Workspace Card */}
                <div className="p-6 rounded-xl border border-[rgb(var(--border))] border-dashed bg-transparent hover:bg-[rgb(var(--bg-secondary))] transition-all flex flex-col justify-center items-center gap-4">
                    <form onSubmit={handleCreateWorkspace} className="w-full flex flex-col gap-3">
                        <input
                            type="text"
                            placeholder="New Workspace Name..."
                            value={newWorkspaceName}
                            onChange={(e) => setNewWorkspaceName(e.target.value)}
                            className="w-full bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border))] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <button
                            type="submit"
                            disabled={!newWorkspaceName.trim() || isCreating}
                            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-md px-4 py-2 text-sm font-medium transition-colors"
                        >
                            {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            Create Workspace
                        </button>
                    </form>
                </div>

                {/* Workspace List */}
                {workspaces.map((workspace) => (
                    <div
                        key={workspace.id}
                        onClick={() => handleSelectWorkspace(workspace.id)}
                        className="p-6 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-secondary))] hover:border-indigo-500/50 hover:shadow-lg transition-all cursor-pointer group flex flex-col"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-[rgb(var(--bg-tertiary))] flex items-center justify-center text-xl">
                                    {workspace.icon || <Folder className="w-5 h-5 text-indigo-400" />}
                                </div>
                                <div>
                                    <h3 className="font-semibold">{workspace.name}</h3>
                                    <p className="text-xs text-[rgb(var(--text-muted))]">
                                        {workspace.pages?.length || 0} pages
                                    </p>
                                </div>
                            </div>
                            <button
                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-[rgb(var(--bg-tertiary))] text-[rgb(var(--text-muted))] transition-opacity"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate('/settings'); // Can link to workspace settings later
                                }}
                            >
                                <Settings className="w-4 h-4" />
                            </button>
                        </div>
                        {workspace.description && (
                            <p className="text-sm text-[rgb(var(--text-muted))] line-clamp-2 mt-auto">
                                {workspace.description}
                            </p>
                        )}
                    </div>
                ))}
            </div>

            {workspaces.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-[rgb(var(--border))] border-dashed rounded-xl">
                    <div className="w-16 h-16 bg-[rgb(var(--bg-secondary))] rounded-full flex items-center justify-center mb-4">
                        <Folder className="w-8 h-8 text-[rgb(var(--text-muted))]" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2">No workspaces yet</h2>
                    <p className="text-[rgb(var(--text-muted))] max-w-md">
                        Create your first workspace above to start organizing your pages, tasks, and team collaboration.
                    </p>
                </div>
            )}
        </div>
    );
}
