import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useUIStore } from '@/store';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { cn } from '@/lib/utils';
import CommandPalette from '@/components/navigation/CommandPalette';
import ShortcutsModal from '@/components/modals/ShortcutsModal';
import InboxPanel from '@/components/notifications/InboxPanel';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const { sidebarCollapsed, inboxOpen, setInboxOpen } = useUIStore();

    return (
        <div className="flex h-screen w-full overflow-hidden bg-[rgb(var(--bg))]">
            <Sidebar />
            <div
                className={cn(
                    "flex flex-col flex-1 min-w-0 transition-all duration-300",
                    sidebarCollapsed ? "ml-0" : "ml-0" // The sidebar will handle its own width, we just flex-1 the rest
                )}
            >
                <Topbar />
                <main className="flex-1 overflow-auto relative">
                    {children}
                </main>
            </div>
            <CommandPalette />
            <ShortcutsModal />
            <InboxPanel isOpen={inboxOpen} onClose={() => setInboxOpen(false)} />
        </div>
    );
}
