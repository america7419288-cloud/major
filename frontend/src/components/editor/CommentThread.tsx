import React, { useState } from 'react';
import { useAuthStore } from '@/store';
import { Comment } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Send, Check, CornerDownRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CommentThreadProps {
    comment: Comment;
    onReply: (parentId: string, content: string) => void;
    onResolve: (id: string) => void;
}

export default function CommentThread({ comment, onReply, onResolve }: CommentThreadProps) {
    const { user } = useAuthStore();
    const [replyContent, setReplyContent] = useState('');
    const [isReplying, setIsReplying] = useState(false);

    const handleSubmitReply = (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyContent.trim()) return;
        onReply(comment.id, replyContent);
        setReplyContent('');
        setIsReplying(false);
    };

    return (
        <div className={cn(
            "p-4 border-b border-zinc-100 dark:border-zinc-900 group",
            comment.resolvedAt && "opacity-60"
        )}>
            {comment.anchorText && (
                <div className="mb-3 px-2 py-1 bg-zinc-50 dark:bg-zinc-900 border-l-2 border-blue-500 text-[11px] italic text-zinc-500 truncate">
                    "{comment.anchorText}"
                </div>
            )}

            <div className="flex gap-3">
                <Avatar className="w-8 h-8">
                    <AvatarImage src={comment.user?.avatar || undefined} />
                    <AvatarFallback>{comment.user?.name?.[0] || '?'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-sm font-semibold truncate">{comment.user?.name}</span>
                        <span className="text-[10px] text-zinc-400 whitespace-nowrap">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                    </div>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed mb-2">
                        {comment.content}
                    </p>

                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setIsReplying(!isReplying)}
                            className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-blue-500 transition-colors"
                        >
                            Reply
                        </button>
                        {!comment.resolvedAt && (
                            <button 
                                onClick={() => onResolve(comment.id)}
                                className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-emerald-500 transition-colors flex items-center gap-1"
                            >
                                <Check size={10} />
                                Resolve
                            </button>
                        )}
                        {comment.resolvedAt && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1">
                                <Check size={10} />
                                Resolved
                            </span>
                        )}
                    </div>

                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-4 space-y-4 ml-2 border-l-2 border-zinc-100 dark:border-zinc-900 pl-4">
                            {comment.replies.map((reply) => (
                                <div key={reply.id} className="flex gap-2">
                                    <Avatar className="w-6 h-6">
                                        <AvatarImage src={reply.user?.avatar || undefined} />
                                        <AvatarFallback>{reply.user?.name?.[0] || '?'}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-0.5">
                                            <span className="text-xs font-semibold truncate">{reply.user?.name}</span>
                                            <span className="text-[9px] text-zinc-400 whitespace-nowrap">
                                                {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                            {reply.content}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Reply Input */}
                    {isReplying && (
                        <form onSubmit={handleSubmitReply} className="mt-4 flex gap-2">
                            <CornerDownRight size={14} className="text-zinc-300 mt-2" />
                            <div className="flex-1 relative">
                                <input
                                    autoFocus
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    placeholder="Reply..."
                                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md py-1.5 pl-3 pr-8 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                <button 
                                    type="submit"
                                    className="absolute right-2 top-1.5 text-zinc-400 hover:text-blue-500 transition-colors"
                                >
                                    <Send size={14} />
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
