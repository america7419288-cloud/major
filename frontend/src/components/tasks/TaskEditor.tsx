import React, { useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Link from '@tiptap/extension-link';
import debounce from 'lodash/debounce';

interface TaskEditorProps {
    initialContent: string;
    onChange: (content: string) => void;
}

export default function TaskEditor({ initialContent, onChange }: TaskEditorProps) {
    // Debounce the onChange to prevent excessive API calls
    const debouncedOnChange = useCallback(
        debounce((html: string) => {
            onChange(html);
        }, 1000),
        [onChange]
    );

    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: 'Add description, notes, or links... (Press / for commands)',
                emptyEditorClass: 'is-editor-empty',
            }),
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-indigo-500 underline hover:text-indigo-600',
                },
            }),
        ],
        content: initialContent,
        onUpdate: ({ editor }) => {
            debouncedOnChange(editor.getHTML());
        },
    });

    // Cleanup debouncer on unmount
    useEffect(() => {
        return () => {
            debouncedOnChange.cancel();
        };
    }, [debouncedOnChange]);

    if (!editor) {
        return null;
    }

    return (
        <div className="w-full min-h-[300px] cursor-text">
            <EditorContent editor={editor} />
        </div>
    );
}
