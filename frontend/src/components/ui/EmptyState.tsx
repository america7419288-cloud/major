import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
    title: string;
    description: string;
    icon: LucideIcon;
    action?: {
        label: string;
        onClick: () => void;
    };
    className?: string;
}

export default function EmptyState({ title, description, icon: Icon, action, className }: EmptyStateProps) {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in duration-500",
            className
        )}>
            <div className="mb-6 p-4 rounded-full bg-zinc-50 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-600 ring-1 ring-zinc-200 dark:ring-zinc-800 shadow-sm">
                <Icon size={48} strokeWidth={1.5} />
            </div>

            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                {title}
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mb-8">
                {description}
            </p>

            {action && (
                <button
                    onClick={action.onClick}
                    className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-[rgb(var(--primary))] text-white font-medium hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-primary/20"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}
