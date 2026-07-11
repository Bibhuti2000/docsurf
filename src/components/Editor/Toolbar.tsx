import { Editor } from '@tiptap/react';
import { Bold, Italic, Strikethrough, Heading1, Heading2, List, ListOrdered, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export const Toolbar = ({ 
  editor,
  onToggleVersions
}: { 
  editor: Editor | null,
  onToggleVersions?: () => void
}) => {
  const [isSummarizing, setIsSummarizing] = useState(false);

  if (!editor) return null;

  const handleAI = async () => {
    const text = editor.state.doc.textBetween(
      editor.state.selection.from,
      editor.state.selection.to,
      ' '
    );
    if (!text) {
      alert("Please select some text first!");
      return;
    }
    
    setIsSummarizing(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const data = await res.json();
        editor.chain().focus().insertContent(`\n\n📝 AI Summary:\n${data.summary}\n`).run();
      } else {
        alert("AI Magic failed. Try again.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="p-2 flex flex-wrap gap-2 items-center bg-card text-card-foreground">
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-muted' : ''}
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-muted' : ''}
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive('strike') ? 'bg-muted' : ''}
        >
          <Strikethrough className="w-4 h-4" />
        </Button>
      </div>

      <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800" />

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? 'bg-muted' : ''}
        >
          <Heading1 className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'bg-muted' : ''}
        >
          <Heading2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800" />

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-muted' : ''}
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'bg-muted' : ''}
        >
          <ListOrdered className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="bg-purple-50 text-purple-600 hover:bg-purple-100 border-purple-200"
          onClick={handleAI}
          disabled={isSummarizing}
        >
          {isSummarizing ? "Thinking..." : "✨ AI Magic"}
        </Button>
      </div>

      {onToggleVersions && (
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleVersions}
          className="ml-auto flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 text-zinc-600 dark:text-zinc-400"
        >
          <History className="w-4 h-4" /> Versions
        </Button>
      )}
    </div>
  );
};
