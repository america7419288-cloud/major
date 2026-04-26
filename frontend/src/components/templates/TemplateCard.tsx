import React from 'react';
import { LucideIcon } from 'lucide-react';

interface TemplateCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    category: string;
    onUse: () => void;
}

export default function TemplateCard({ title, description, icon: Icon, category, onUse }: TemplateCardProps) {
    return (
        <div className="group relative flex flex-col p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-[rgb(var(--primary))] transition-all hover:shadow-xl hover:shadow-primary/5">
            <div className="mb-4 p-3 w-fit rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 group-hover:scale-110 group-hover:text-[rgb(var(--primary))] transition-all">
                <Icon size={24} />
            </div>

            <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--primary))] opacity-80">
                    {category}
                </span>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-[rgb(var(--primary))] transition-colors">
                    {title}
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
                    {description}
                </p>
            </div>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onUse();
                }}
                className="mt-6 w-full py-2 px-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg font-medium opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:bg-[rgb(var(--primary))] dark:hover:bg-[rgb(var(--primary))] hover:text-white"
            >
                Use Template
            </button>
        </div>
    );
}
