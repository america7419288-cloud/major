import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import CharacterCount from '@tiptap/extension-character-count';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { useEffect } from 'react';

import { SlashCommand } from './extensions/SlashCommand';
import suggestion from './extensions/suggestion';

const lowlight = createLowlight(common);

interface EditorProps {
    content: string;
    onChange: (content: string) => void;
    editable?: boolean;
}

export default function Editor({ content, onChange, editable = true }: EditorProps) {
    let initialContent: any = content;
    try {
        if (typeof content === 'string' && content.startsWith('{')) {
            initialContent = JSON.parse(content);
        }
    } catch (e) {
        // Fallback to HTML string
    }

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                codeBlock: false,
            }),
            Placeholder.configure({
                placeholder: 'Type "/" for commands...',
            }),
            SlashCommand.configure({
                suggestion: {
                    ...suggestion,
                    char: '/',
                    command: ({ editor, range, props }: any) => {
                        props.command({ editor, range });
                    },
                },
            }),
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
            Link.configure({
                openOnClick: false,
            }),
            Image,
            CharacterCount,
            CodeBlockLowlight.configure({
                lowlight,
            }),
        ],
        content: initialContent,
        editable: editable,
        onUpdate: ({ editor }) => {
            onChange(JSON.stringify(editor.getJSON()));
        },
        editorProps: {
            attributes: {
                class: 'prose prose-invert max-w-none focus:outline-none min-h-[500px]',
            },
        },
    });

    useEffect(() => {
        if (!editor) return;
        
        let parsedContent: any = content;
        try {
            if (typeof content === 'string' && content.startsWith('{')) {
                parsedContent = JSON.parse(content);
            }
        } catch (e) {}

        const currentHTML = editor.getHTML();
        // Skip update if content hasn't really changed to avoid cursor jumping
        if (content !== currentHTML && JSON.stringify(parsedContent) !== JSON.stringify(editor.getJSON())) {
            editor.commands.setContent(parsedContent, { emitUpdate: false });
        }
    }, [content, editor]);

    if (!editor) return null;

    return (
        <div className="relative w-full">
            <EditorContent editor={editor} />
        </div>
    );
}
