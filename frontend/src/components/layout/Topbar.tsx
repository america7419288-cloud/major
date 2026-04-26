import { useState, useMemo } from 'react';
import { useUIStore, useAuthStore, usePageStore } from '@/store';
import { Menu, Share2, CloudCheck, CloudUpload, Settings2, MessageSquare } from 'lucide-react';
import { useLocation, useParams } from 'react-router-dom';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import NotificationBell from '../collaboration/NotificationBell';
import ShareModal from '../collaboration/ShareModal';
import PresenceAvatars from '../collaboration/PresenceAvatars';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';

export default function Topbar() {
    const { toggleSidebar, sidebarCollapsed, toggleRightPanel, toggleInbox } = useUIStore();
    const { user } = useAuthStore();
    const { saving, pages, activePageId } = usePageStore();
    const location = useLocation();
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    const currentPage = useMemo(() => 
        activePageId ? pages.find(p => p.id === activePageId) : null,
    [activePageId, pages]);

    // Get current workspace ID from path if applicable
    const pathParts = location.pathname.split('/');
    const workspaceId = pathParts[1] === 'workspace' ? pathParts[2] : null;

    const { data: workspace } = useQuery({
        queryKey: ['workspace', workspaceId],
        queryFn: () => api.get(`/workspaces/${workspaceId}`).then(res => res.data.data),
        enabled: !!workspaceId,
    });

    const displayTitle = useMemo(() => {
        if (currentPage) return currentPage.title;
        const title = location.pathname.split('/')[1] || 'Dashboard';
        return title.charAt(0).toUpperCase() + title.slice(1);
    }, [currentPage, location.pathname]);

    return (
        <div className="h-12 border-b border-[rgb(var(--border))] flex items-center justify-between px-4 shrink-0 bg-[rgb(var(--bg))]">
            <div className="flex items-center gap-3">
                {(sidebarCollapsed || isMobile) && (
                    <button onClick={toggleSidebar} className="btn-ghost p-1 !px-1">
                        <Menu size={18} />
                    </button>
                )}
                <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold text-[rgb(var(--text-primary))]">
                        {displayTitle}
                    </div>
                    {activePageId && (
                        <div className="flex items-center gap-1 text-[10px] font-medium text-zinc-400 ml-2">
                            {saving ? (
                                <>
                                    <CloudUpload size={12} className="animate-pulse" />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <CloudCheck size={12} />
                                    <span>Saved</span>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-3">
                {activePageId && (
                    <div className="flex items-center border-r border-zinc-200 dark:border-zinc-800 pr-2 mr-2 gap-1">
                        <button 
                            onClick={() => toggleInbox()}
                            className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
                            title="Comments"
                        >
                            <MessageSquare size={18} />
                        </button>
                        <button 
                            onClick={() => toggleRightPanel()}
                            className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
                            title="Settings"
                        >
                            <Settings2 size={18} />
                        </button>
                    </div>
                )}

                {workspace && (
                    <button
                        onClick={() => setIsShareModalOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                    >
                        <Share2 size={14} />
                        <span className="hidden sm:inline">Share</span>
                    </button>
                )}
                <PresenceAvatars />
                <NotificationBell />
                <div className="flex items-center gap-2 cursor-pointer hover:bg-[rgb(var(--bg-tertiary))] p-1 rounded-md transition-colors">
                    <div className="w-6 h-6 rounded-md bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                        {user?.name?.[0] || 'U'}
                    </div>
                </div>
            </div>

            {workspace && (
                <ShareModal
                    workspace={workspace}
                    isOpen={isShareModalOpen}
                    onClose={() => setIsShareModalOpen(false)}
                />
            )}
        </div>
    );
}
