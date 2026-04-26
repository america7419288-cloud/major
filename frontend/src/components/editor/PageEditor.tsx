import React, { useEffect, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { usePageStore } from '@/store';
import { useParams } from 'react-router-dom';
import { Loader2, Cloud, CloudOff } from 'lucide-react';
import { api } from '@/lib/axios';

export default function PageEditor() {
    const { id } = useParams<{ id: string }>();
    const { updatePage, saving } = usePageStore();
    const [title, setTitle] = useState('');
    const [initialContent, setInitialContent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch page data
    useEffect(() => {
        const fetchPage = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const res = await api.get(`/pages/${id}`);
                const page = res.data.data;
                setTitle(page.title || 'Untitled');
                
                let parsedContent = '{"type":"doc","content":[{"type":"paragraph"}]}';
                try {
                    parsedContent = typeof page.content === 'string' ? JSON.parse(page.content) : page.content;
                } catch (e) {
                    console.error("Failed to parse page content", e);
                }
                
                setInitialContent(parsedContent);
                setLoading(false);
            } catch (err) {
                console.error('Failed to load page', err);
                setError('Failed to load page.');
                setLoading(false);
            }
        };

        fetchPage();
    }, [id]);

    // Autosave Debounce Logic
    useEffect(() => {
        if (!id || loading) return;
        const handler = setTimeout(() => {
            updatePage(id, { title });
        }, 1000);
        return () => clearTimeout(handler);
    }, [title, id, loading]);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: "Press '/' for commands or start typing...",
            }),
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
        ],
        content: initialContent,
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none dark:prose-invert max-w-none',
            },
        },
        onUpdate: ({ editor }) => {
            if (!id) return;
            const json = editor.getJSON();
            updatePage(id, { content: JSON.stringify(json) });
        },
    }, [initialContent]);

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-[rgb(var(--text-muted))]" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 flex items-center justify-center h-full text-destructive">
                {error}
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto bg-[rgb(var(--bg-primary))]">
            {/* Header / Topbar */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-[rgb(var(--bg-primary))]/80 backdrop-blur-sm border-b border-[rgb(var(--border))]">
                <div className="text-sm text-[rgb(var(--text-muted))] flex items-center gap-2">
                    {/* Breadcrumbs could go here */}
                    <span>{title || 'Untitled'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[rgb(var(--text-muted))]">
                    {saving ? (
                        <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Saving...</span>
                        </>
                    ) : (
                        <>
                            <Cloud className="w-3 h-3" />
                            <span>Saved</span>
                        </>
                    )}
                </div>
            </div>

            {/* Editor Container */}
            <div className="max-w-4xl mx-auto px-8 py-12">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Untitled"
                    className="w-full text-4xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 mb-8 placeholder:text-[rgb(var(--text-muted))]"
                />
                
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}
