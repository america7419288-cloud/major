import React from 'react';
import {
    Calendar,
    Rocket,
    BookOpen,
    MessageSquare,
    Wallet,
    CheckSquare,
    Search
} from 'lucide-react';
import TemplateCard from '@/components/templates/TemplateCard';
import { toast } from 'sonner';

const TEMPLATES = [
    {
        id: 'weekly-planner',
        title: 'Weekly Planner',
        description: 'Organize your week with focus areas, daily tasks, and mood tracking.',
        icon: Calendar,
        category: 'Planning',
    },
    {
        id: 'project-roadmap',
        title: 'Project Roadmap',
        description: 'Track milestones, deliverables, and timelines for your next big thing.',
        icon: Rocket,
        category: 'Project Management',
    },
    {
        id: 'meeting-notes',
        title: 'Meeting Notes',
        description: 'Structured notes for meetings with action items and follow-ups.',
        icon: MessageSquare,
        category: 'Collaboration',
    },
    {
        id: 'reading-list',
        title: 'Reading List',
        description: 'Keep track of books, articles, and podcasts with progress status.',
        icon: BookOpen,
        category: 'Personal',
    },
    {
        id: 'finance-tracker',
        title: 'Personal Finance',
        description: 'Budgeting tool to track income, expenses, and savings goals.',
        icon: Wallet,
        category: 'Finance',
    },
    {
        id: 'daily-todo',
        title: 'Ultimate To-Do List',
        description: 'A powerful task manager with priority tags and subtasks.',
        icon: CheckSquare,
        category: 'Productivity',
    },
];

export default function TemplatesPage() {
    const handleUseTemplate = (template: typeof TEMPLATES[0]) => {
        toast.promise(
            // Simulate template application
            new Promise((resolve) => setTimeout(resolve, 1500)),
            {
                loading: `Applying ${template.title}...`,
                success: `${template.title} has been added to your workspace!`,
                error: 'Failed to apply template.',
            }
        );
    };

    return (
        <div className="flex flex-col h-full bg-[rgb(var(--background))]">
            <header className="px-8 py-12 border-b border-zinc-200 dark:border-zinc-800">
                <div className="max-w-6xl mx-auto space-y-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">
                            Templates Gallery
                        </h1>
                        <p className="text-xl text-zinc-500 dark:text-zinc-400">
                            Start with a proven structure for any project or workflow.
                        </p>
                    </div>

                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search templates..."
                            className="w-full pl-10 pr-4 py-2 bg-zinc-100 dark:bg-zinc-800 border-none rounded-lg focus:ring-2 focus:ring-[rgb(var(--primary))] transition-all shadow-sm"
                        />
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto px-8 py-12">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {TEMPLATES.map((template) => (
                        <TemplateCard
                            key={template.id}
                            {...template}
                            onUse={() => handleUseTemplate(template)}
                        />
                    ))}
                </div>
            </main>
        </div>
    );
}
