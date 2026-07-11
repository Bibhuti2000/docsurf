import { Node, RawCommands } from '@tiptap/core';
import Document from '@tiptap/extension-document';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    page: {
      addPage: () => ReturnType;
    };
  }
}

export const CustomDocument = Document.extend({
  content: 'page+',
});

export const Page = Node.create({
  name: 'page',
  group: 'block',
  content: 'block+',
  defining: true,
  isolating: true,

  parseHTML() {
    return [
      { tag: 'div[data-type="page"]' },
    ];
  },

  renderHTML() {
    return ['div', { 'data-type': 'page', class: 'editor-page' }, 0];
  },

  addCommands() {
    return {
      addPage: () => ({ chain }: { chain: () => { splitNode: (name: string) => { run: () => boolean } } }) => {
        return chain()
          .splitNode('page')
          .run();
      },
    } as unknown as RawCommands;
  },
});
