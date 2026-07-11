import { Node, mergeAttributes, RawCommands } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    setPageBreak: () => ReturnType;
  }
}

export const PageBreak = Node.create({
  name: 'pageBreak',
  group: 'block',
  selectable: true,
  draggable: true,

  parseHTML() {
    return [
      { tag: 'div[data-type="page-break"]' },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'page-break' })];
  },

  addCommands() {
    return {
      setPageBreak: () => ({ chain }: { chain: () => { insertContent: (content: { type: string }) => { run: () => boolean } } }) => {
        return chain()
          .insertContent({ type: 'pageBreak' })
          .run();
      },
    } as unknown as RawCommands;
  },
});
