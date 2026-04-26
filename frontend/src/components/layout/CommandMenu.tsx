import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { useWorkspaceStore, useTaskStore } from '@/store';
import { FileText, CheckCircle, Search, Plus, Hash } from 'lucide-react';

export const CommandMenu = () => {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const { workspaces } = useWorkspaceStore();
    const { tasks } = useTaskStore();

    // Toggle the menu when ⌘K is pressed
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    const runCommand = (command: () => void) => {
        setOpen(false);
        command();
    };

    return (
        <Command.Dialog
            open={open}
            onOpenChange={setOpen}
            label="Global Command Menu"
            className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-zinc-950/20 backdrop-blur-sm"
        >
            <div className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden outline-none">
                <div className="flex items-center px-4 border-b border-zinc-100 dark:border-zinc-800">
                    <Search className="w-4 h-4 text-zinc-400 mr-2" />
                    <Command.Input
                        placeholder="Search for pages, tasks or commands..."
                        className="w-full h-12 bg-transparent border-none outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 text-sm"
                    />
                </div>

                <Command.List className="max-h-[300px] overflow-y-auto p-2 scrollbar-none">
                    <Command.Empty className="py-6 text-center text-sm text-zinc-500">
                        No results found.
                    </Command.Empty>

                    <Command.Group heading="Pages" className="px-2 mb-2">
                        <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1 px-2">Pages</div>
                        {workspaces.map(workspace => (
                            workspace.pages?.map(page => (
                                <Command.Item
                                    key={page.id}
                                    onSelect={() => runCommand(() => navigate(`/workspaces/${workspace.id}/pages/${page.id}`))}
                                    className="flex items-center gap-2 px-2 py-2 rounded-md cursor-default select-none hover:bg-zinc-100 dark:hover:bg-zinc-800 aria-selected:bg-zinc-100 dark:aria-selected:bg-zinc-800 text-sm text-zinc-700 dark:text-zinc-300 transition-colors"
                                >
                                    <FileText className="w-4 h-4 text-zinc-400" />
                                    <span>{page.title || 'Untitled'}</span>
                                </Command.Item>
                            ))
                        ))}
                    </Command.Group>

                    {tasks.length > 0 && (
                        <Command.Group heading="Tasks" className="px-2 mb-2">
                            <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1 px-2">Tasks</div>
                            {tasks.slice(0, 10).map(task => (
                                <Command.Item
                                    key={task.id}
                                    onSelect={() => runCommand(() => navigate(`/tasks?id=${task.id}`))}
                                    className="flex items-center gap-2 px-2 py-2 rounded-md cursor-default select-none hover:bg-zinc-100 dark:hover:bg-zinc-800 aria-selected:bg-zinc-100 dark:aria-selected:bg-zinc-800 text-sm text-zinc-700 dark:text-zinc-300 transition-colors"
                                >
                                    <CheckCircle className="w-4 h-4 text-zinc-400" />
                                    <span>{task.title}</span>
                                </Command.Item>
                            ))}
                        </Command.Group>
                    )}

                    <Command.Group heading="Actions" className="px-2">
                        <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1 px-2">Actions</div>
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/tasks'))}
                            className="flex items-center gap-2 px-2 py-2 rounded-md cursor-default select-none hover:bg-zinc-100 dark:hover:bg-zinc-800 aria-selected:bg-zinc-100 dark:aria-selected:bg-zinc-800 text-sm text-zinc-700 dark:text-zinc-300 transition-colors"
                        >
                            <Plus className="w-4 h-4 text-zinc-400" />
                            <span>Go to Tasks</span>
                        </Command.Item>
                    </Command.Group>
                </Command.List>
            </div>
        </Command.Dialog>
    );
};
