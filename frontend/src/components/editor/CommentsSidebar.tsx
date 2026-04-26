import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { Comment } from '@/types';
import { MessageSquare, X, Send, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CommentThread from './CommentThread';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CommentsSidebarProps {
    pageId: string;
    onClose: () => void;
}

export default function CommentsSidebar({ pageId, onClose }: CommentsSidebarProps) {
    const queryClient = useQueryClient();
    const [newComment, setNewComment] = useState('');
    const [showResolved, setShowResolved] = useState(false);
    const [activeBlockId, setActiveBlockId] = useState<string | null>(null);

    // Listen for block-specific comment triggers
    React.useEffect(() => {
        const handleOpenBlockComments = (e: any) => {
            setActiveBlockId(e.detail.blockId);
        };
        window.addEventListener('open-block-comments', handleOpenBlockComments);
        return () => window.removeEventListener('open-block-comments', handleOpenBlockComments);
    }, []);

    const { data: comments = [], isLoading } = useQuery<Comment[]>({
        queryKey: ['comments', pageId],
        queryFn: async () => {
            const res = await api.get(`/comments?entityType=PAGE&entityId=${pageId}`);
            return res.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: { content: string; parentId?: string; anchorText?: string; blockSnapshot?: any }) => 
            api.post('/comments', {
                entityType: 'PAGE',
                entityId: pageId,
                ...data
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', pageId] });
            setNewComment('');
        },
    });

    const resolveMutation = useMutation({
        mutationFn: (id: string) => api.patch(`/comments/${id}/resolve`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', pageId] });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        
        createMutation.mutate({ 
            content: newComment,
            anchorText: activeBlockId || undefined,
        });
    };

    const filteredComments = comments.filter(c => {
        const matchesResolved = showResolved ? true : !c.resolvedAt;
        const matchesBlock = activeBlockId ? c.anchorText === activeBlockId : true;
        return matchesResolved && matchesBlock;
    });

    return (
        <div className="w-80 border-l border-zinc-200 dark:border-zinc-800 h-full bg-white dark:bg-zinc-950 flex flex-col shadow-xl">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2 font-semibold text-sm">
                        <MessageSquare size={16} />
                        Comments
                    </div>
                    {activeBlockId && (
                        <div className="text-[10px] text-blue-500 font-medium flex items-center gap-1 mt-0.5">
                            Filtering by block
                            <button onClick={() => setActiveBlockId(null)} className="hover:underline">
                                (Clear)
                            </button>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className={cn("h-8 w-8 p-0", showResolved && "text-blue-500")}
                        onClick={() => setShowResolved(!showResolved)}
                        title={showResolved ? "Hide resolved" : "Show resolved"}
                    >
                        <Filter size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
                        <X size={16} />
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="p-8 text-center text-zinc-400 text-xs">Loading comments...</div>
                ) : filteredComments.length === 0 ? (
                    <div className="p-12 text-center text-zinc-400">
                        <MessageSquare size={32} className="mx-auto mb-4 opacity-20" />
                        <p className="text-sm">No comments yet</p>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {filteredComments.map((comment) => (
                            <CommentThread 
                                key={comment.id} 
                                comment={comment} 
                                onReply={(parentId, content) => createMutation.mutate({ content, parentId })}
                                onResolve={(id) => resolveMutation.mutate(id)}
                            />
                        ))}
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
                <form onSubmit={handleSubmit} className="relative">
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="w-full bg-zinc-100 dark:bg-zinc-900 border-none rounded-lg p-3 pr-12 text-sm resize-none focus:ring-1 focus:ring-blue-500 min-h-[80px]"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                    />
                    <button 
                        type="submit"
                        disabled={!newComment.trim() || createMutation.isPending}
                        className="absolute right-3 bottom-3 p-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send size={16} />
                    </button>
                </form>
            </div>
        </div>
    );
}
