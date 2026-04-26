import React, { useState } from 'react';
import { Bell, Check, Trash2, ExternalLink } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { Notification } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

import { useNavigate } from 'react-router-dom';

export default function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const { data: notifications = [] } = useQuery<Notification[]>({
        queryKey: ['notifications'],
        queryFn: async () => {
            const res = await api.get('/notifications');
            return res.data;
        },
        refetchInterval: 30000, // Refetch every 30 seconds
    });

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const markAsReadMutation = useMutation({
        mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    const markAllAsReadMutation = useMutation({
        mutationFn: () => api.patch('/notifications/read-all'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/notifications/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors relative"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-zinc-950">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden"
                        >
                            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                                <h3 className="font-semibold">Notifications</h3>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={() => markAllAsReadMutation.mutate()}
                                        className="text-xs text-blue-500 hover:underline"
                                    >
                                        Mark all as read
                                    </button>
                                )}
                            </div>

                            <div className="max-h-[400px] overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center text-zinc-500">
                                        <Bell className="mx-auto mb-2 opacity-20" size={32} />
                                        <p className="text-sm">No notifications yet</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
                                        {notifications.map((notification) => (
                                            <div
                                                key={notification.id}
                                                className={cn(
                                                    "p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors group cursor-pointer",
                                                    !notification.isRead && "bg-blue-50/30 dark:bg-blue-900/10"
                                                )}
                                                onClick={() => {
                                                    if (notification.link) {
                                                        navigate(notification.link);
                                                    }
                                                    if (!notification.isRead) {
                                                        markAsReadMutation.mutate(notification.id);
                                                    }
                                                    setIsOpen(false);
                                                }}
                                            >
                                                <div className="flex gap-3">
                                                    <div className="flex-grow min-w-0">
                                                        <div className="flex items-center justify-between gap-2 mb-1">
                                                            <p className="text-sm font-semibold truncate">
                                                                {notification.title}
                                                            </p>
                                                            <span className="text-[10px] text-zinc-500 whitespace-nowrap">
                                                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-2">
                                                            {notification.content}
                                                        </p>
                                                        <div className="flex items-center gap-3">
                                                            {notification.link && (
                                                                <div className="text-[10px] items-center gap-1 text-blue-500 hover:underline flex">
                                                                    <ExternalLink size={10} /> View
                                                                </div>
                                                            )}
                                                            {!notification.isRead && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        markAsReadMutation.mutate(notification.id);
                                                                    }}
                                                                    className="text-[10px] items-center gap-1 text-emerald-500 hover:underline flex"
                                                                >
                                                                    <Check size={10} /> Mark read
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    deleteMutation.mutate(notification.id);
                                                                }}
                                                                className="text-[10px] items-center gap-1 text-red-500 hover:underline opacity-0 group-hover:opacity-100 transition-opacity flex"
                                                            >
                                                                <Trash2 size={10} /> Delete
                                                            </button>
                                                        </div>
                                                    </div>
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
        </div>
    );
}
