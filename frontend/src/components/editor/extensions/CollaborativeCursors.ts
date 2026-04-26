import { Extension } from '@tiptap/core';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export interface CollaborativeCursorsOptions {
  user: {
    id: string;
    name: string;
    color: string;
  };
  onCursorUpdate: (position: number) => void;
  cursors: Array<{
    userId: string;
    userName: string;
    color: string;
    position: number;
    timestamp: number;
  }>;
}

export const CollaborativeCursors = Extension.create<CollaborativeCursorsOptions>({
  name: 'collaborativeCursors',

  addOptions() {
    return {
      user: {
        id: '',
        name: '',
        color: '#ff0000',
      },
      onCursorUpdate: () => {},
      cursors: [],
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('collaborative-cursors'),
        state: {
          init: () => DecorationSet.empty,
          apply: (tr, set, oldState, newState) => {
            const cursors = this.options.cursors;
            const decorations = cursors
              .filter(cursor => cursor.userId !== this.options.user.id)
              .map(cursor => {
                const el = document.createElement('div');
                el.className = 'collaboration-cursor';
                el.style.borderLeftColor = cursor.color;
                
                const label = document.createElement('div');
                label.className = 'collaboration-cursor-label';
                label.style.backgroundColor = cursor.color;
                label.innerText = cursor.userName;
                el.appendChild(label);

                // Map position through transactions
                const pos = tr.mapping.map(cursor.position);
                
                return Decoration.widget(pos, el, {
                  side: -1,
                  key: cursor.userId,
                });
              });

            return DecorationSet.create(newState.doc, decorations);
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
          handleKeyDown: (view, event) => {
            // Optional: detect inactivity or specific keys
            return false;
          },
        },
        view: (view) => {
          return {
            update: (view, prevState) => {
              const { selection } = view.state;
              if (!selection.empty) return;
              
              const pos = selection.from;
              this.options.onCursorUpdate(pos);
            },
          };
        },
      }),
    ];
  },
});
