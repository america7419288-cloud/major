import React, { useState, useEffect } from 'react';
import { Send, MessageSquare, X } from 'lucide-react';
import { useAuthStore } from '@/store';
import api from '@/lib/api';
import { Comment } from '@/types';
import CommentItem from './CommentItem';
import { cn } from '@/lib/utils';

interface CommentSectionProps {
    entityType: 'PAGE' | 'TASK' | 'DATABASE';
    entityId: string;
    onClose?: () => void;
    className?: string;
}

export default function CommentSection({ entityType, entityId, onClose, className }: CommentSectionProps) {
    const { user } = useAuthStore();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [replyTo, setReplyTo] = useState<string | null>(null);

    const fetchComments = async () => {
        try {
            const response = await api.get(`/comments?entityType=${entityType}&entityId=${entityId}`);
            setComments(response.data);
        } catch (error) {
            console.error('Failed to fetch comments', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [entityType, entityId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            const response = await api.post('/comments', {
                entityType,
                entityId,
                content: newComment,
                parentId: replyTo
            });

            if (replyTo) {
                // If it's a reply, we can either re-fetch or find the parent and push it
                fetchComments();
            } else {
                setComments([response.data, ...comments]);
            }

            setNewComment('');
            setReplyTo(null);
        } catch (error) {
            console.error('Failed to post comment', error);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await api.delete(`/comments/${id}`);
            fetchComments(); // Simplest to re-fetch
        } catch (error) {
            console.error('Failed to delete comment', error);
        }
    };

    const handleUpdate = async (id: string, content: string) => {
        // For simplicity, we could open an inline editor, but for now just console log
        console.log('Update comment', id, content);
    };

    return (
        <div className={cn(
            "flex flex-col h-full w-full max-w-sm border-l border-[rgb(var(--border))] bg-[rgb(var(--bg))] shadow-xl",
            className
        )}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[rgb(var(--border))]">
                <div className="flex items-center gap-2 font-semibold text-[rgb(var(--text-primary))]">
                    <MessageSquare className="h-5 w-5" />
                    Discussion
                </div>
                {onClose && (
                    <button onClick={onClose} className="p-1 hover:bg-[rgb(var(--accent))] rounded transition-colors text-[rgb(var(--text-muted))]">
                        <X className="h-5 w-5" />
                    </button>
                )}
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {loading ? (
                    <div className="flex items-center justify-center py-10 text-[rgb(var(--text-muted))] text-sm">
                        Loading comments...
                    </div>
                ) : comments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-[rgb(var(--text-muted))]">
                        <MessageSquare className="h-10 w-10 opacity-20 mb-2" />
                        <p className="text-sm">No comments yet</p>
                        <p className="text-xs">Start the conversation below</p>
                    </div>
                ) : (
                    comments.map(comment => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            onReply={(id) => setReplyTo(id)}
                            onDelete={handleDelete}
                            onUpdate={handleUpdate}
                            currentUserId={user?.id}
                        />
                    ))
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-[rgb(var(--border))] bg-[rgb(var(--bg-secondary))] bg-opacity-50">
                {replyTo && (
                    <div className="flex items-center justify-between mb-2 py-1 px-2 bg-[rgb(var(--accent))] rounded text-xs text-[rgb(var(--text-primary))]">
                        <span>Replying to comment...</span>
                        <button onClick={() => setReplyTo(null)} className="p-0.5 hover:bg-black/5 rounded">
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                )}
                <form onSubmit={handleSubmit} className="relative">
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        className="w-full min-h-[80px] p-3 text-sm bg-[rgb(var(--bg))] border border-[rgb(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))] resize-none text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-muted))]"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!newComment.trim()}
                        className="absolute bottom-3 right-3 p-1.5 bg-[rgb(var(--primary))] text-white rounded-md hover:opacity-90 disabled:opacity-50 transition-all shadow-sm"
                    >
                        <Send className="h-4 w-4" />
                    </button>
                </form>
                <p className="mt-2 text-[10px] text-[rgb(var(--text-muted))] text-center">
                    Press Enter to post, Shift + Enter for new line
                </p>
            </div>
        </div>
    );
}
