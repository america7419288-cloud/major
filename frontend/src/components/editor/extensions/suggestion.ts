import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import CommandList from './CommandList';

export default {
    items: ({ query }: { query: string }) => {
        return [
            {
                title: 'Text',
                description: 'Just start typing with plain text.',
                searchTerms: ['p', 'paragraph'],
                icon: 'Text',
                command: ({ editor, range }: any) => {
                    editor
                        .chain()
                        .focus()
                        .deleteRange(range)
                        .toggleNode('paragraph', 'paragraph')
                        .run();
                },
            },
            {
                title: 'Heading 1',
                description: 'Big section heading.',
                searchTerms: ['title', 'big', 'large'],
                icon: 'Heading1',
                command: ({ editor, range }: any) => {
                    editor
                        .chain()
                        .focus()
                        .deleteRange(range)
                        .setNode('heading', { level: 1 })
                        .run();
                },
            },
            {
                title: 'Heading 2',
                description: 'Medium section heading.',
                searchTerms: ['subtitle', 'medium'],
                icon: 'Heading2',
                command: ({ editor, range }: any) => {
                    editor
                        .chain()
                        .focus()
                        .deleteRange(range)
                        .setNode('heading', { level: 2 })
                        .run();
                },
            },
            {
                title: 'Heading 3',
                description: 'Small section heading.',
                searchTerms: ['subtitle', 'small'],
                icon: 'Heading3',
                command: ({ editor, range }: any) => {
                    editor
                        .chain()
                        .focus()
                        .deleteRange(range)
                        .setNode('heading', { level: 3 })
                        .run();
                },
            },
            {
                title: 'Bullet List',
                description: 'Create a simple bulleted list.',
                searchTerms: ['unordered', 'point'],
                icon: 'List',
                command: ({ editor, range }: any) => {
                    editor
                        .chain()
                        .focus()
                        .deleteRange(range)
                        .toggleBulletList()
                        .run();
                },
            },
            {
                title: 'Numbered List',
                description: 'Create a list with numbering.',
                searchTerms: ['ordered'],
                icon: 'ListOrdered',
                command: ({ editor, range }: any) => {
                    editor
                        .chain()
                        .focus()
                        .deleteRange(range)
                        .toggleOrderedList()
                        .run();
                },
            },
            {
                title: 'To-do List',
                description: 'Track tasks with a to-do list.',
                searchTerms: ['todo', 'checkbox', 'task'],
                icon: 'CheckSquare',
                command: ({ editor, range }: any) => {
                    editor
                        .chain()
                        .focus()
                        .deleteRange(range)
                        .toggleTaskList()
                        .run();
                },
            },
            {
                title: 'Quote',
                description: 'Capture a quotation.',
                searchTerms: ['blockquote'],
                icon: 'Quote',
                command: ({ editor, range }: any) => {
                    editor
                        .chain()
                        .focus()
                        .deleteRange(range)
                        .toggleBlockquote()
                        .run();
                },
            },
            {
                title: 'Divider',
                description: 'Visually divide sections.',
                searchTerms: ['horizontal', 'rule', 'line'],
                icon: 'Minus',
                command: ({ editor, range }: any) => {
                    editor
                        .chain()
                        .focus()
                        .deleteRange(range)
                        .setHorizontalRule()
                        .run();
                },
            },
            {
                title: 'Code Block',
                description: 'Capture a code snippet.',
                searchTerms: ['codeblock', 'pre'],
                icon: 'Code',
                command: ({ editor, range }: any) => {
                    editor
                        .chain()
                        .focus()
                        .deleteRange(range)
                        .toggleCodeBlock()
                        .run();
                },
            },
            {
                title: 'Image',
                description: 'Upload or embed an image.',
                searchTerms: ['picture', 'photo'],
                icon: 'ImageIcon',
                command: ({ editor, range }: any) => {
                    const url = window.prompt('URL');
                    if (url) {
                        editor
                            .chain()
                            .focus()
                            .deleteRange(range)
                            .setImage({ src: url })
                            .run();
                    }
                },
            },
        ].filter((item) => {
            if (typeof query !== 'string' || !query) return true;
            return (
                item.title.toLowerCase().includes(query.toLowerCase()) ||
                (item.searchTerms &&
                    item.searchTerms.some((term: string) =>
                        term.includes(query.toLowerCase())
                    ))
            );
        });
    },

    render: () => {
        let component: any;
        let popup: any;

        return {
            onStart: (props: any) => {
                component = new ReactRenderer(CommandList, {
                    props,
                    editor: props.editor,
                });

                if (!props.clientRect) {
                    return;
                }

                popup = tippy('body', {
                    getReferenceClientRect: props.clientRect,
                    appendTo: () => document.body,
                    content: component.element,
                    showOnCreate: true,
                    interactive: true,
                    trigger: 'manual',
                    placement: 'bottom-start',
                });
            },

            onUpdate(props: any) {
                component.updateProps(props);

                if (!props.clientRect) {
                    return;
                }

                popup[0].setProps({
                    getReferenceClientRect: props.clientRect,
                });
            },

            onKeyDown(props: any) {
                if (props.event.key === 'Escape') {
                    popup[0].hide();

                    return true;
                }

                return component.ref?.onKeyDown(props);
            },

            onExit() {
                popup[0].destroy();
                component.destroy();
            },
        };
    },
};
