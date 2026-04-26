import React, { useEffect, useCallback, useState, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Image } from '@tiptap/extension-image';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { SlashCommand } from './extensions/SlashCommand';
import suggestion from './extensions/suggestion';
import BubbleToolbar from './BubbleToolbar';
import { usePageStore } from '@/store/page.store';
import { useAuthStore, usePresenceStore, useWorkspaceStore } from '@/store';
import { debounce, throttle } from 'lodash';
import { cn } from '@/lib/utils';
import { CollaborativeCursors } from './extensions/CollaborativeCursors';
import { BlockComments } from './extensions/BlockComments';
import { MentionsExtension } from './extensions/MentionsExtension';

interface TiptapEditorProps {
    pageId: string;
    initialContent: any;
    onContentChange?: (content: any) => void;
}

const USER_COLORS = [
    '#958DF1',
    '#F98181',
    '#FBBC88',
    '#FAF594',
    '#70C2B4',
    '#94FADB',
    '#B9F18D',
];

const getDeterministicColor = (userId: string) => {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
};

export default function TiptapEditor({ pageId, initialContent, onContentChange }: TiptapEditorProps) {
    const { updatePage, setSaving, pages } = usePageStore();
    const { user } = useAuthStore();
    const { socket } = usePresenceStore();
    const { workspaces, activeWorkspaceId } = useWorkspaceStore() as any;
    const [remoteCursors, setRemoteCursors] = useState<any[]>([]);
    const page = pages.find(p => p.id === pageId) as any;

    const isEditable = useMemo(() => {
        if (!page || !user) return false;
        
        // 0. Page owner can always edit
        if (page.createdById === user.id) return true;

        // 1. Check workspace role (Owner/Admin can always edit)
        const workspace = workspaces.find((w: any) => w.id === activeWorkspaceId);
        const member = workspace?.members?.find((m: any) => m.userId === user.id);
        if (member && (member.role === 'OWNER' || member.role === 'ADMIN')) return true;

        // 2. Check explicit page permission
        const pagePermission = page.permissions?.[0];
        if (pagePermission) {
            return pagePermission.level === 'FULL_ACCESS' || pagePermission.level === 'CAN_EDIT';
        }

        // 3. Default to workspace member (if no specific page restriction, they can edit)
        return !!member;
    }, [page, user, workspaces, activeWorkspaceId]);

    const members = useMemo(() => {
        const workspace = workspaces.find((w: any) => w.id === activeWorkspaceId);
        return workspace?.members?.map((m: any) => m.user) || [];
    }, [workspaces, activeWorkspaceId]);

    const debouncedUpdate = useCallback(
        debounce(async (id: string, content: any) => {
            try {
                await updatePage(id, { content: JSON.stringify(content) });
            } catch (error) {
                console.error('Failed to autosave:', error);
            } finally {
                setSaving(false);
            }
        }, 2000),
        [updatePage, setSaving]
    );

    const throttledCursorUpdate = useMemo(
        () => throttle((pos: number) => {
            if (socket && user) {
                socket.emit('cursor:update', {
                    pageId,
                    position: pos,
                    userId: user.id,
                    userName: user.name,
                    color: getDeterministicColor(user.id)
                });
            }
        }, 100),
        [socket, user, pageId]
    );

    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: ({ node }) => {
                    if (node.type.name === 'heading') {
                        return `Heading ${node.attrs.level}`;
                    }
                    return "Press '/' for commands...";
                },
            }),
            Image.configure({
                HTMLAttributes: {
                    class: 'rounded-lg max-w-full h-auto my-4',
                },
            }),
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
            SlashCommand.configure({
                suggestion: {
                    ...suggestion,
                    char: '/',
                    command: ({ editor, range, props }: any) => {
                        props.command({ editor, range });
                    },
                },
            }),
            CollaborativeCursors.configure({
                user: {
                    id: user?.id || '',
                    name: user?.name || 'Anonymous',
                    color: user ? getDeterministicColor(user.id) : '#ff0000',
                },
                onCursorUpdate: throttledCursorUpdate,
                cursors: remoteCursors,
            }),
            BlockComments.configure({
                comments: [], // TODO: Get comments from store
                onCommentClick: (blockId) => {
                    // TODO: Open comment sidebar for this block
                    window.dispatchEvent(new CustomEvent('open-block-comments', { detail: { blockId } }));
                },
            }),
            MentionsExtension(members),
        ],
        editable: isEditable,
        content: initialContent ? (typeof initialContent === 'string' ? JSON.parse(initialContent) : initialContent) : '',
        onUpdate: ({ editor }) => {
            const json = editor.getJSON();
            setSaving(true);
            debouncedUpdate(pageId, json);
            if (onContentChange) onContentChange(json);
        },
        editorProps: {
            attributes: {
                class: cn(
                    "prose prose-sm sm:prose-base dark:prose-invert focus:outline-none max-w-none pb-32 min-h-[500px]",
                    page?.fontStyle === 'serif' && "font-serif",
                    page?.fontStyle === 'mono' && "font-mono",
                    page?.isSmallText && "prose-sm"
                ),
            },
        },
    }, [user, members]);

    // Handle remote cursor updates
    useEffect(() => {
        if (!socket) return;

        const handleCursorUpdated = (data: any) => {
            setRemoteCursors(prev => {
                const filtered = prev.filter(c => c.userId !== data.userId);
                return [...filtered, data];
            });
        };

        const handleCursorRemoved = (data: any) => {
            setRemoteCursors(prev => prev.filter(c => c.userId !== data.userId));
        };

        socket.on('cursor:updated', handleCursorUpdated);
        socket.on('cursor:removed', handleCursorRemoved);

        return () => {
            socket.off('cursor:updated', handleCursorUpdated);
            socket.off('cursor:removed', handleCursorRemoved);
        };
    }, [socket]);

    // Update CollaborativeCursors extension when remoteCursors change
    useEffect(() => {
        if (editor) {
            editor.setEditable(isEditable);
            editor.extensionManager.extensions.find(e => e.name === 'collaborativeCursors')?.configure({
                cursors: remoteCursors,
            });
        }
    }, [editor, remoteCursors, isEditable]);

    // Update editor content when pageId changes
    useEffect(() => {
        if (editor && pageId) {
            const currentPage = pages.find(p => p.id === pageId);
            if (currentPage) {
                const content = typeof currentPage.content === 'string' 
                    ? JSON.parse(currentPage.content) 
                    : currentPage.content;
                
                // Only set content if it's different to avoid cursor reset
                if (JSON.stringify(editor.getJSON()) !== JSON.stringify(content)) {
                    editor.commands.setContent(content);
                }
            }
        }
    }, [pageId, editor, pages]);

    if (!editor) return null;

    return (
        <div className="relative w-full">
            {isEditable && <BubbleToolbar editor={editor} />}
            <EditorContent editor={editor} />
        </div>
    );
}
