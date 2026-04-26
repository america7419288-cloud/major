import React from 'react';
import { BubbleMenu } from '@tiptap/react/menus';
import { type Editor } from '@tiptap/core';
import { 
    Bold, 
    Italic, 
    Underline, 
    Strikethrough, 
    Code, 
    Link as LinkIcon, 
    MessageSquare 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BubbleToolbarProps {
    editor: Editor;
}

export default function BubbleToolbar({ editor }: BubbleToolbarProps) {
    if (!editor) return null;

    const setLink = () => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);

        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    return (
        <BubbleMenu 
            editor={editor as any} 
            className="flex items-center gap-0.5 overflow-hidden rounded-md border border-zinc-200 bg-white p-1 shadow-md dark:border-zinc-800 dark:bg-zinc-950"
        >
            <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={cn(
                    "p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors",
                    editor.isActive('bold') ? "text-blue-500 bg-blue-50 dark:bg-blue-900/20" : "text-zinc-600 dark:text-zinc-400"
                )}
                title="Bold"
            >
                <Bold size={16} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={cn(
                    "p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors",
                    editor.isActive('italic') ? "text-blue-500 bg-blue-50 dark:bg-blue-900/20" : "text-zinc-600 dark:text-zinc-400"
                )}
                title="Italic"
            >
                <Italic size={16} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={cn(
                    "p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors",
                    editor.isActive('underline') ? "text-blue-500 bg-blue-50 dark:bg-blue-900/20" : "text-zinc-600 dark:text-zinc-400"
                )}
                title="Underline"
            >
                <Underline size={16} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={cn(
                    "p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors",
                    editor.isActive('strike') ? "text-blue-500 bg-blue-50 dark:bg-blue-900/20" : "text-zinc-600 dark:text-zinc-400"
                )}
                title="Strikethrough"
            >
                <Strikethrough size={16} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleCode().run()}
                className={cn(
                    "p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors",
                    editor.isActive('code') ? "text-blue-500 bg-blue-50 dark:bg-blue-900/20" : "text-zinc-600 dark:text-zinc-400"
                )}
                title="Inline Code"
            >
                <Code size={16} />
            </button>
            <button
                onClick={setLink}
                className={cn(
                    "p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors",
                    editor.isActive('link') ? "text-blue-500 bg-blue-50 dark:bg-blue-900/20" : "text-zinc-600 dark:text-zinc-400"
                )}
                title="Link"
            >
                <LinkIcon size={16} />
            </button>
            
            <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-1" />
            
            <button
                onClick={() => {
                    // Logic for adding a comment will be handled by the parent
                }}
                className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-400"
                title="Comment"
            >
                <MessageSquare size={16} />
            </button>
        </BubbleMenu>
    );
}
