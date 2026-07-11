'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export const NewDocumentButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() })
      });

      if (res.ok) {
        const data = await res.json();
        setIsOpen(false);
        setTitle('');
        router.push(`/document/${data.id}`);
      } else {
        const text = await res.text();
        setError(text || 'Failed to create document');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)} 
        className="transition-all hover:scale-105 active:scale-95 shadow-md"
      >
        <Plus className="mr-2 h-4 w-4" /> New Document
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-all animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-card border rounded-xl shadow-xl p-6 scale-95 md:scale-100 animate-in slide-in-from-bottom-4 duration-300">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="font-bold text-foreground text-lg">Create New Document</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Input Form */}
            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Document Title
                </label>
                <input 
                  type="text"
                  required
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="E.g., Quarterly Report, Project Specs"
                  className="w-full text-sm px-3 py-2 border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                />
              </div>

              {error && (
                <div className="p-2.5 bg-destructive/15 border border-destructive/20 text-destructive text-xs rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsOpen(false)}
                  className="transition-all hover:scale-105"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="transition-all hover:scale-105 active:scale-95"
                >
                  {isLoading ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
