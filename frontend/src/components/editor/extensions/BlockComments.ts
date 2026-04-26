import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export interface BlockCommentsOptions {
  comments: Array<{
    id: string;
    entityId: string;
    entityType: string;
    anchorText?: string;
    blockSnapshot?: any;
  }>;
  onCommentClick: (blockId: string) => void;
}

export const BlockComments = Extension.create<BlockCommentsOptions>({
  name: 'blockComments',

  addOptions() {
    return {
      comments: [],
      onCommentClick: () => {},
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading', 'bulletList', 'orderedList', 'taskList', 'blockquote', 'codeBlock'],
        attributes: {
          blockId: {
            default: null,
            parseHTML: element => element.getAttribute('data-block-id'),
            renderHTML: attributes => {
              if (!attributes.blockId) {
                return {};
              }
              return {
                'data-block-id': attributes.blockId,
              };
            },
          },
        },
      },
    ];
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('block-comments'),
        props: {
          decorations: (state) => {
            const decorations: Decoration[] = [];
            const { comments } = this.options;

            state.doc.descendants((node, pos) => {
              const blockId = node.attrs.blockId;
              if (blockId) {
                const hasComment = comments.some(c => c.entityId === blockId);
                if (hasComment) {
                  decorations.push(
                    Decoration.node(pos, pos + node.nodeSize, {
                      class: 'has-comment',
                    })
                  );
                }
              }
            });

            return DecorationSet.create(state.doc, decorations);
          },
          handleClick: (view, pos, event) => {
            const target = event.target as HTMLElement;
            const blockElement = target.closest('[data-block-id]');
            if (blockElement) {
              const blockId = blockElement.getAttribute('data-block-id');
              if (blockId && target.classList.contains('comment-icon')) {
                this.options.onCommentClick(blockId);
                return true;
              }
            }
            return false;
          },
        },
      }),
    ];
  },
});
