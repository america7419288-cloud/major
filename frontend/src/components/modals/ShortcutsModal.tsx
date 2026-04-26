import React, { useEffect, useState } from 'react';
import { X, Command, Apple, Hash, Search, Plus, Trash2, Save, Sidebar as SidebarIcon, Moon, Sun, ArrowLeft, ArrowRight, CornerDownLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShortcutGroup {
    title: string;
    items: {
        keys: string[];
        description: string;
        icon?: React.ReactNode;
    }[];
}

const SHORTCUTS: ShortcutGroup[] = [
    {
        title: 'General',
        items: [
            { keys: ['Ctrl', 'K'], description: 'Open search / Command Palette', icon: <Search size={14} /> },
            { keys: ['Ctrl', 'Shift', 'L'], description: 'Toggle Theme', icon: <Moon size={14} /> },
            { keys: ['Ctrl', '\\'], description: 'Toggle Sidebar', icon: <SidebarIcon size={14} /> },
            { keys: ['?'], description: 'Show this shortcuts guide' },
        ],
    },
    {
        title: 'Editor',
        items: [
            { keys: ['Ctrl', 'S'], description: 'Save changes', icon: <Save size={14} /> },
            { keys: ['/'], description: 'Open slash commands' },
            { keys: ['Ctrl', 'Shift', 'B'], description: 'Bold' },
            { keys: ['Ctrl', 'Shift', 'I'], description: 'Italic' },
        ],
    },
    {
        title: 'Navigation',
        items: [
            { keys: ['Alt', 'Left'], description: 'Go back', icon: <ArrowLeft size={14} /> },
            { keys: ['Alt', 'Right'], description: 'Go forward', icon: <ArrowRight size={14} /> },
            { keys: ['Esc'], description: 'Close modal or panel' },
        ],
    },
];

export default function ShortcutsModal() {
    const [isOpen, setIsOpen] = useState(false);
    const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
                setIsOpen(true);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    if (!isOpen) return null;

    const replaceCtrl = (keys: string[]) => {
        return keys.map(k => k === 'Ctrl' ? (isMac ? '⌘' : 'Ctrl') : k);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={() => setIsOpen(false)}
            />

            <div className="relative w-full max-w-2xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
                <div className="flex items-center justify-between p-4 border-b border-[rgb(var(--border))] bg-[rgb(var(--bg-secondary))]">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-500">
                            <Command size={18} />
                        </div>
                        <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1 rounded-md hover:bg-[rgb(var(--bg-tertiary))] text-[rgb(var(--text-muted))] transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {SHORTCUTS.map((group) => (
                            <div key={group.title} className="flex flex-col gap-4">
                                <h3 className="text-[11px] font-bold uppercase tracking-wider text-[rgb(var(--text-muted))]">
                                    {group.title}
                                </h3>
                                <div className="flex flex-col gap-3">
                                    {group.items.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between group">
                                            <div className="flex items-center gap-3">
                                                {item.icon && (
                                                    <div className="text-[rgb(var(--text-muted))] group-hover:text-[rgb(var(--text))] transition-colors">
                                                        {item.icon}
                                                    </div>
                                                )}
                                                <span className="text-sm text-[rgb(var(--text-muted))] group-hover:text-[rgb(var(--text))] transition-colors">
                                                    {item.description}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {replaceCtrl(item.keys).map((key, kIdx) => (
                                                    <React.Fragment key={kIdx}>
                                                        <kbd className="min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded border border-[rgb(var(--border))] bg-[rgb(var(--bg-secondary))] text-[10px] font-medium shadow-sm">
                                                            {key}
                                                        </kbd>
                                                        {kIdx < item.keys.length - 1 && (
                                                            <span className="text-[10px] text-[rgb(var(--text-muted))]">+</span>
                                                        )}
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-4 border-t border-[rgb(var(--border))] bg-[rgb(var(--bg-secondary))] text-center">
                    <p className="text-xs text-[rgb(var(--text-muted))]">
                        Tip: Press <kbd className="px-1 rounded border border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[10px]">Esc</kbd> to close this guide.
                    </p>
                </div>
            </div>
        </div>
    );
}
