import React, { useEffect, useState, useMemo } from 'react';
import { useUIStore } from '@/store';
import { cn } from '@/lib/utils';
import { Search as SearchIcon, FileText, CheckCircle2, Layout, Plus, Settings } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { useNavigate } from 'react-router-dom';

export default function CommandPalette() {
    const navigate = useNavigate();
    const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore();
    const [search, setSearch] = useState('');

    const { data: pages = [] } = useQuery({
        queryKey: ['pages'],
        queryFn: () => api.get('/pages').then(res => res.data.data),
        enabled: commandPaletteOpen,
    });

    const { data: tasks = [] } = useQuery({
        queryKey: ['tasks'],
        queryFn: () => api.get('/tasks').then(res => res.data.data),
        enabled: commandPaletteOpen,
    });

    const results = useMemo(() => {
        if (!search) return [];
        const term = search.toLowerCase();

        const filteredPages = pages
            .filter((p: any) => p.title?.toLowerCase().includes(term))
            .map((p: any) => ({
                id: p.id,
                title: p.title || 'Untitled Page',
                type: 'page',
                icon: <FileText size={16} />,
                onSelect: () => navigate(`/pages/${p.id}`)
            }));

        const filteredTasks = tasks
            .filter((t: any) => t.title?.toLowerCase().includes(term))
            .map((t: any) => ({
                id: t.id,
                title: t.title,
                type: 'task',
                icon: <CheckCircle2 size={16} />,
                onSelect: () => navigate(`/tasks`)
            }));

        return [...filteredPages, ...filteredTasks].slice(0, 8);
    }, [search, pages, tasks, navigate]);

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setCommandPaletteOpen(!commandPaletteOpen);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, [commandPaletteOpen, setCommandPaletteOpen]);

    useEffect(() => {
        if (!commandPaletteOpen) setSearch('');
    }, [commandPaletteOpen]);

    if (!commandPaletteOpen) return null;

    const handleSelect = (result: any) => {
        result.onSelect();
        setCommandPaletteOpen(false);
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setCommandPaletteOpen(false)}
        >
            <div
                className="w-full max-w-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center px-4 h-12 border-b border-[rgb(var(--border))]">
                    <SearchIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <input
                        className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-[rgb(var(--text-muted))] disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Search for pages, tasks..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        autoFocus
                    />
                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-[rgb(var(--border))] bg-[rgb(var(--bg-secondary))] px-1.5 font-mono text-[10px] font-medium text-[rgb(var(--text-muted))] opacity-100">
                        ESC
                    </kbd>
                </div>

                <div className="max-h-[350px] overflow-y-auto p-2">
                    {!search ? (
                        <div className="flex flex-col gap-1">
                            <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-[rgb(var(--text-muted))]">
                                Quick Actions
                            </div>
                            <button
                                onClick={() => { navigate('/tasks'); setCommandPaletteOpen(false); }}
                                className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-[rgb(var(--bg-tertiary))] transition-colors w-full text-left"
                            >
                                <Layout size={16} className="text-indigo-500" />
                                <span>Go to Dashboard</span>
                            </button>
                            <button
                                onClick={() => { navigate('/settings'); setCommandPaletteOpen(false); }}
                                className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-[rgb(var(--bg-tertiary))] transition-colors w-full text-left"
                            >
                                <Settings size={16} className="text-[rgb(var(--text-muted))]" />
                                <span>Open Settings</span>
                            </button>
                        </div>
                    ) : results.length > 0 ? (
                        <div className="flex flex-col gap-1">
                            <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-[rgb(var(--text-muted))]">
                                Search Results
                            </div>
                            {results.map((result: any) => (
                                <button
                                    key={`${result.type}-${result.id}`}
                                    onClick={() => handleSelect(result)}
                                    className="flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-[rgb(var(--bg-tertiary))] transition-colors w-full text-left group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="text-[rgb(var(--text-muted))] group-hover:text-indigo-500 transition-colors">
                                            {result.icon}
                                        </div>
                                        <span>{result.title}</span>
                                    </div>
                                    <span className="text-[10px] uppercase font-bold text-[rgb(var(--text-muted))] group-hover:opacity-100 opacity-0 transition-opacity">
                                        {result.type}
                                    </span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center">
                            <div className="text-sm text-[rgb(var(--text-muted))]">
                                No results found for "<span className="font-semibold text-[rgb(var(--text))]">{search}</span>"
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
