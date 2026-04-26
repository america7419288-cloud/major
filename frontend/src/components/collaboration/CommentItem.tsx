import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { User, Comment } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar';
import { MoreHorizontal, Reply, Trash2, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommentItemProps {
    comment: Comment;
    onReply?: (commentId: string) => void;
    onDelete?: (commentId: string) => void;
    onUpdate?: (commentId: string, newContent: string) => void;
    currentUserId?: string;
}

export default function CommentItem({
    comment,
    onReply,
    onDelete,
    onUpdate,
    currentUserId
}: CommentItemProps) {
    const isOwner = currentUserId === comment.userId;

    return (
        <div className="group flex gap-3 py-4 border-b border-[rgb(var(--border))] last:border-0">
            <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full overflow-hidden bg-[rgb(var(--accent))] flex items-center justify-center border border-[rgb(var(--border))]">
                    {comment.user.avatar ? (
                        <img src={comment.user.avatar} alt={comment.user.name ?? 'User'} className="h-full w-full object-cover" />
                    ) : (
                        <span className="text-xs font-semibold text-[rgb(var(--text-muted))] uppercase">
                            {(comment.user.name || 'U').charAt(0)}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-[rgb(var(--text-primary))]">
                        {comment.user.name ?? 'Unknown User'}
                    </span>
                    <span className="text-xs text-[rgb(var(--text-muted))]">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                </div>

                <div className="text-sm text-[rgb(var(--text-secondary))] leading-relaxed whitespace-pre-wrap">
                    {comment.content}
                </div>

                <div className="flex items-center gap-4 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onReply?.(comment.id)}
                        className="flex items-center gap-1.5 text-xs text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))] transition-colors"
                    >
                        <Reply className="h-3.5 w-3.5" />
                        Reply
                    </button>

                    {isOwner && (
                        <>
                            <button
                                onClick={() => onUpdate?.(comment.id, comment.content)}
                                className="flex items-center gap-1.5 text-xs text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))] transition-colors"
                            >
                                <Edit2 className="h-3.5 w-3.5" />
                                Edit
                            </button>
                            <button
                                onClick={() => onDelete?.(comment.id)}
                                className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 transition-colors"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                            </button>
                        </>
                    )}
                </div>

                {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-4 ml-2 pl-4 border-l-2 border-[rgb(var(--border))]">
                        {comment.replies.map(reply => (
                            <CommentItem
                                key={reply.id}
                                comment={reply}
                                onReply={onReply}
                                onDelete={onDelete}
                                onUpdate={onUpdate}
                                currentUserId={currentUserId}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
