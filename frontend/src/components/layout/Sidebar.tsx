import { useEffect, useState } from 'react';
import { useUIStore, useWorkspaceStore } from '@/store';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Search, Inbox, Calendar, Star, Plus, Settings, Trash, Hash, Loader2, ChevronDown, FileText, LayoutTemplate } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '@/lib/axios';
import { Page, Workspace } from '@/types';
import { toast } from 'sonner';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { LogOut } from 'lucide-react';
import PageTree from './PageTree';
import { usePageStore } from '@/store';
import { useNotificationStore } from '@/store/notification.store';

import { useMediaQuery } from '@/hooks/use-media-query';

export default function Sidebar() {
    const { sidebarCollapsed, toggleSidebar, toggleCommandPalette, activeWorkspaceId, setActiveWorkspace, setInboxOpen } = useUIStore();
    const { unreadCount, fetchNotifications } = useNotificationStore();
    const isMobile = useMediaQuery("(max-width: 768px)");
    const { workspaces, fetchWorkspaces } = useWorkspaceStore();
    const { tree, loading: loadingPages, fetchPages, createPage } = usePageStore();
    const [creatingPage, setCreatingPage] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Auto-collapse sidebar on mobile
    useEffect(() => {
        if (isMobile && !sidebarCollapsed) {
            toggleSidebar();
        }
    }, [isMobile]);

    // Fetch Workspaces on Init
    useEffect(() => {
        fetchWorkspaces().then(() => {
            const currentWorkspaces = useWorkspaceStore.getState().workspaces;
            if (currentWorkspaces.length > 0 && !useUIStore.getState().activeWorkspaceId) {
                useUIStore.getState().setActiveWorkspace(currentWorkspaces[0].id);
            }
        });
        
        // Fetch notifications on init
        fetchNotifications();
    }, []);

    // Fetch Pages when Active Workspace Changes
    useEffect(() => {
        if (activeWorkspaceId) {
            fetchPages(activeWorkspaceId);
        }
    }, [activeWorkspaceId]);

    const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);

    const handleCreatePage = async () => {
        if (!activeWorkspaceId) return;
        try {
            setCreatingPage(true);
            const newPageId = await createPage(activeWorkspaceId);
            if (newPageId) {
                navigate(`/pages/${newPageId}`);
                if (isMobile) toggleSidebar();
            }
        } finally {
            setCreatingPage(false);
        }
    };

    const navItems = [
        { label: 'Inbox', icon: <Inbox size={16} />, path: '/inbox' },
        { label: 'Today', icon: <Calendar size={16} />, path: '/today' },
        { label: 'Tasks', icon: <Hash size={16} />, path: '/tasks' },
        { label: 'Templates', icon: <LayoutTemplate size={16} />, path: '/templates' },
    ];

    const bottomItems = [
        { label: 'Settings', icon: <Settings size={16} />, path: '/settings' },
        { label: 'Trash', icon: <Trash size={16} />, path: '/trash' },
    ];

    const onItemClick = (path: string) => {
        if (path === '/inbox') {
            setInboxOpen(true);
            if (isMobile) toggleSidebar();
            return;
        }
        navigate(path);
        if (isMobile) toggleSidebar();
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isMobile && !sidebarCollapsed && (
                <div
                    className="fixed inset-0 bg-black/20 z-[40] backdrop-blur-sm animate-in fade-in duration-300"
                    onClick={toggleSidebar}
                />
            )}

            <div
                className={cn(
                    "h-full bg-[rgb(var(--bg-secondary))] border-r border-[rgb(var(--border))] flex flex-col transition-all duration-300 relative group z-[50]",
                    isMobile ? (
                        sidebarCollapsed ? "-translate-x-full w-0 opacity-0" : "fixed left-0 top-0 translate-x-0 w-[280px] opacity-100 shadow-2xl"
                    ) : (
                        sidebarCollapsed ? "w-0 opacity-0 overflow-hidden" : "w-64 opacity-100"
                    )
                )}
            >
                {/* Search Trigger */}
                <button
                    onClick={() => {
                        const kDown = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, metaKey: true });
                        document.dispatchEvent(kDown);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 mb-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-sm group transition-colors text-left"
                >
                    <Search className="w-4 h-4" />
                    <span className="flex-1">Search</span>
                    {!isMobile && (
                        <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-1.5 font-mono text-[10px] font-medium text-zinc-400 opacity-100 group-hover:bg-zinc-100 dark:group-hover:bg-zinc-800">
                            <span className="text-xs">⌘</span>K
                        </kbd>
                    )}
                </button>

                {/* Workspaces & Navigation */}
                <div className="h-12 flex items-center px-4 font-semibold text-sm border-b border-[rgb(var(--border))] cursor-pointer hover:bg-[rgb(var(--bg-tertiary))] justify-between">
                    <span className="truncate">{activeWorkspace?.name || 'My Workspace'}</span>
                    <ChevronDown size={14} className="text-[rgb(var(--text-muted))]" />
                </div>

                <div className="flex-1 overflow-y-auto py-3 px-2 flex flex-col gap-1 text-[13px]">
                    <div
                        className="sidebar-item"
                        onClick={toggleCommandPalette}
                    >
                        <Search size={16} />
                        <span>Search</span>
                        {!isMobile && <span className="ml-auto kbd">Ctrl K</span>}
                    </div>

                    <div className="my-2" />

                    {navItems.map((item) => (
                        <div
                            key={item.path}
                            className={cn("sidebar-item", (location.pathname === item.path && item.path !== '/inbox') && "active")}
                            onClick={() => onItemClick(item.path)}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                            {item.path === '/inbox' && unreadCount > 0 && (
                                <span className="ml-auto bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </div>
                    ))}

                    <div className="mt-6 mb-2 px-2 text-[11px] font-bold text-[rgb(var(--text-subtle))] tracking-wider flex items-center justify-between group/section">
                        <span>PAGES</span>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleCreatePage(); }}
                            className="opacity-0 group-hover/section:opacity-100 hover:bg-[rgb(var(--bg-tertiary))] p-0.5 rounded transition-opacity"
                        >
                            <Plus size={14} />
                        </button>
                    </div>

                    {loadingPages ? (
                        <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-4 w-4 animate-spin text-[rgb(var(--text-muted))]" />
                        </div>
                    ) : (
                        <PageTree pages={tree} workspaceId={activeWorkspaceId || ''} />
                    )}

                    {tree.length === 0 && !loadingPages && (
                        <div className="px-2 py-4 text-[11px] text-[rgb(var(--text-muted))] text-center">
                            No pages in this workspace.
                        </div>
                    )}

                </div>

                <div className="p-2 border-t border-[rgb(var(--border))] mt-auto flex flex-col gap-1">
                    <div className="sidebar-item" onClick={handleCreatePage}>
                        {creatingPage ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                        <span>New Page</span>
                    </div>
                    {bottomItems.map((item) => (
                        <div
                            key={item.path}
                            className={cn("sidebar-item", location.pathname === item.path && "active")}
                            onClick={() => onItemClick(item.path)}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </div>
                    ))}
                    <div className="sidebar-item text-destructive hover:bg-destructive/10" onClick={() => signOut(auth)}>
                        <LogOut size={16} />
                        <span>Sign Out</span>
                    </div>
                </div>

                {!isMobile && (
                    <button
                        onClick={toggleSidebar}
                        className={cn(
                            "absolute -right-3 top-12 bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border))] rounded-full p-0.5 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--bg-tertiary))] z-50 transition-opacity",
                            sidebarCollapsed ? "opacity-100 pointer-events-auto" : "opacity-0 group-hover:opacity-100"
                        )}
                    >
                        {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                    </button>
                )}
            </div>
        </>
    );
}
