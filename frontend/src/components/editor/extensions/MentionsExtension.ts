import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import Mention from '@tiptap/extension-mention';
import MentionList from '../MentionList';

export const MentionsExtension = (members: any[]) => Mention.configure({
  HTMLAttributes: {
    class: 'mention',
  },
  suggestion: {
    char: '@',
    command: ({ editor, range, props }) => {
      editor
        .chain()
        .focus()
        .insertContentAt(range, [
          {
            type: 'mention',
            attrs: props,
          },
          {
            type: 'text',
            text: ' ',
          },
        ])
        .run();
    },
    items: ({ query }) => {
      return members
        .filter(member => 
          member.name.toLowerCase().startsWith(query.toLowerCase())
        )
        .slice(0, 5);
    },
    render: () => {
      let component: any;
      let popup: any;

      return {
        onStart: (props: any) => {
          component = new ReactRenderer(MentionList, {
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
  },
});
