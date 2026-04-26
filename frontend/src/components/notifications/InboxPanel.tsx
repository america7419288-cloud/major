import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Trash2, CheckCircle2 } from 'lucide-react';
import { useNotificationStore } from '@/store/notification.store';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Notification } from '@/api/notifications';
import { useNavigate } from 'react-router-dom';

interface InboxPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function InboxPanel({ isOpen, onClose }: InboxPanelProps) {
    const { 
        notifications, 
        fetchNotifications, 
        markAsRead, 
        markAllAsRead, 
        deleteNotification,
        isLoading 
    } = useNotificationStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen, fetchNotifications]);

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.isRead) {
            markAsRead(notification.id);
        }
        if (notification.link) {
            navigate(notification.link);
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]"
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-[rgb(var(--background))] border-l border-[rgb(var(--border))] shadow-2xl z-[101] flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-[rgb(var(--border))]">
                            <div className="flex items-center gap-2 font-semibold">
                                <Bell size={18} />
                                Inbox
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => markAllAsRead()}
                                    title="Mark all as read"
                                    className="p-1.5 text-zinc-400 hover:text-[rgb(var(--text-primary))] hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                                >
                                    <CheckCircle2 size={18} />
                                </button>
                                <button
                                    onClick={onClose}
                                    className="p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto">
                            {isLoading && notifications.length === 0 ? (
                                <div className="p-8 text-center text-zinc-500">Loading notifications...</div>
                            ) : notifications.length === 0 ? (
                                <div className="p-8 text-center text-zinc-500 flex flex-col items-center gap-3">
                                    <Bell size={32} className="text-zinc-300 dark:text-zinc-700" />
                                    <p>You're all caught up!</p>
                                </div>
                            ) : (
                                <div className="flex flex-col">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={cn(
                                                "group flex items-start gap-3 p-4 border-b border-[rgb(var(--border))] cursor-pointer transition-colors",
                                                !notification.isRead 
                                                    ? "bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20" 
                                                    : "hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                                            )}
                                            onClick={() => handleNotificationClick(notification)}
                                        >
                                            <div className="mt-1 flex-shrink-0 relative">
                                                {!notification.isRead && (
                                                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
                                                )}
                                                <div className="w-8 h-8 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                                                    {notification.type === 'ASSIGNMENT' ? <CheckCircle2 size={16} /> : <Bell size={16} />}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={cn(
                                                    "text-[15px] font-medium leading-tight mb-1",
                                                    !notification.isRead ? "text-[rgb(var(--text-primary))]" : "text-[rgb(var(--text-secondary))]"
                                                )}>
                                                    {notification.title}
                                                </p>
                                                <p className="text-[13px] text-zinc-500 line-clamp-2">
                                                    {notification.content}
                                                </p>
                                                <p className="text-[11px] text-zinc-400 mt-2 font-medium uppercase tracking-wider">
                                                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                                </p>
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteNotification(notification.id);
                                                    }}
                                                    className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
