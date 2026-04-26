import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Plus, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Task } from '@/types';

interface TaskAssignmentPopupProps {
    isOpen: boolean;
    onClose: () => void;
    task: Task;
    workspaceName: string;
    onGoToWorkspace: () => void;
    onAddToCurrentWorkspace: () => void;
}

export const TaskAssignmentPopup = ({
    isOpen,
    onClose,
    task,
    workspaceName,
    onGoToWorkspace,
    onAddToCurrentWorkspace,
}: TaskAssignmentPopupProps) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-md bg-[rgb(var(--surface))] rounded-2xl shadow-2xl border border-[rgb(var(--border))] overflow-hidden"
                    >
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                                    <ExternalLink size={24} />
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="mb-6">
                                <h3 className="text-xl font-bold tracking-tight mb-2">
                                    Go to the assigned task's workspace?
                                </h3>
                                <p className="text-sm text-zinc-500 leading-relaxed">
                                    The task "<span className="font-semibold text-zinc-900 dark:text-zinc-100">{task.title}</span>" is located in the <span className="font-semibold text-zinc-900 dark:text-zinc-100">{workspaceName}</span> workspace.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3">
                                <Button
                                    onClick={onGoToWorkspace}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                                >
                                    <MapPin size={18} />
                                    Switch to {workspaceName}
                                </Button>
                                
                                <Button
                                    variant="ghost"
                                    onClick={onAddToCurrentWorkspace}
                                    className="w-full h-12 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                >
                                    <Plus size={18} />
                                    Add this task to my current workspace
                                </Button>
                            </div>
                        </div>
                        
                        <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-[rgb(var(--border))] flex items-center justify-center">
                            <button 
                                onClick={onClose}
                                className="text-xs font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 uppercase tracking-wider"
                            >
                                Maybe later
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
