import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { usePageStore } from '@/store/page.store';
import { useAuthStore, usePresenceStore, useUIStore } from '@/store';
import { PageSkeleton } from '@/components/ui/SkeletonLoader';
import EditorHeader from '@/components/editor/EditorHeader';
import TiptapEditor from '@/components/editor/TiptapEditor';
import PageSettingsPanel from '@/components/editor/PageSettingsPanel';
import CommentsSidebar from '@/components/editor/CommentsSidebar';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

export default function PageView() {
    const { pageId } = useParams<{ pageId: string }>();
    const { pages, fetchPages, activePageId, setActivePage } = usePageStore();
    const { user } = useAuthStore();
    const { joinPage, leavePage } = usePresenceStore();
    const { rightPanelOpen, toggleRightPanel, inboxOpen, setInboxOpen } = useUIStore();
    
    const page = useMemo(() => 
        pages.find(p => p.id === pageId),
    [pages, pageId]);

    useEffect(() => {
        if (pageId) {
            setActivePage(pageId);
        }
        return () => {
            setActivePage(null);
        };
    }, [pageId, setActivePage]);

    useEffect(() => {
        if (pageId && user) {
            joinPage(pageId, {
                userId: user.id,
                name: user.name || 'Anonymous',
                avatarUrl: user.avatar || undefined,
            });

            return () => {
                leavePage(pageId, user.id);
            };
        }
    }, [pageId, user, joinPage, leavePage]);

    if (!pageId) return null;

    if (!page) {
        return <PageSkeleton />;
    }

    return (
        <div className="flex h-full w-full overflow-hidden bg-[rgb(var(--background))]">
            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                <EditorHeader pageId={pageId} />
                
                <div className={cn(
                    "mx-auto px-12 transition-all duration-300",
                    page.isFullWidth ? "max-w-full" : "max-w-4xl"
                )}>
                    <TiptapEditor 
                        pageId={pageId} 
                        initialContent={page.content} 
                    />
                </div>
            </div>

            <AnimatePresence>
                {rightPanelOpen && (
                    <motion.div
                        initial={{ x: 300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 300, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="h-full z-20"
                    >
                        <PageSettingsPanel pageId={pageId} />
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {inboxOpen && (
                    <motion.div
                        initial={{ x: 300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 300, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="h-full z-20"
                    >
                        <CommentsSidebar 
                            pageId={pageId} 
                            onClose={() => setInboxOpen(false)} 
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
