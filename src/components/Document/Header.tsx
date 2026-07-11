'use client';
import { useState, useEffect } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { Button } from '@/components/ui/button';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { UserPlus, ChevronLeft, Cloud, CloudOff, Loader2 } from 'lucide-react';
import { ShareModal } from './ShareModal';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const Header = ({ 
  user,
  documentId,
  documentTitle,
  role
}: { 
  user?: { name?: string | null, email?: string | null },
  documentId?: string,
  documentTitle?: string,
  role?: 'OWNER' | 'EDITOR' | 'VIEWER'
}) => {
  const { status, isSaving, activeUsers } = useEditorStore();
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [title, setTitle] = useState(documentTitle || '');

  // Keep local title in sync if prop changes
  useEffect(() => {
    if (documentTitle) setTitle(documentTitle);
  }, [documentTitle]);

  const handleTitleChange = async (newTitle: string) => {
    if (!newTitle.trim() || newTitle === documentTitle) return;
    try {
      await fetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() })
      });
    } catch (e) {
      console.error(e);
    }
  };
  
  return (
    <header className="flex items-center justify-between p-4 border-b bg-background">
      <div className="flex items-center gap-2">
        {documentId && (
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="flex items-center gap-1 -ml-2 text-muted-foreground hover:text-foreground">
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>
          </Link>
        )}
        <Link href="/dashboard" className="text-xl font-bold tracking-tight text-foreground transition-all hover:scale-105">
          DocSurf
        </Link>
        
        {documentId && documentTitle !== undefined && (
          <div className="flex items-center gap-2 border-l pl-4 ml-2">
            <input
              type="text"
              value={title}
              disabled={role === 'VIEWER'}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => handleTitleChange(title)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              className="font-semibold text-sm bg-transparent border-b border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-zinc-500 focus:outline-none px-1 py-0.5 rounded text-foreground transition-all w-40 sm:w-64"
            />
            {/* Sync Indicator */}
            <div className="flex items-center gap-1.5 ml-1 transition-all">
              {status === 'connected' && (
                isSaving ? (
                  <div className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-full font-medium select-none animate-pulse">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                    <span className="hidden sm:inline">Saving...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-full font-medium select-none">
                    <Cloud className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="hidden sm:inline">Synced</span>
                  </div>
                )
              )}
              {status === 'connecting' && (
                <div className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-full font-medium select-none">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                  <span className="hidden sm:inline">Syncing...</span>
                </div>
              )}
              {status === 'disconnected' && (
                <div className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-full font-medium select-none">
                  <CloudOff className="w-3.5 h-3.5 text-rose-500" />
                  <span className="hidden sm:inline">Offline</span>
                </div>
              )}
            </div>
          </div>
        )}

        {user && !documentId && (
          <span className="text-sm px-2 py-1 bg-secondary text-secondary-foreground rounded-full flex items-center gap-2 transition-all ml-2">
            <span className="w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-600 animate-pulse"></span>
            {status}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex -space-x-2 mr-4">
            {activeUsers.map((u, i) => (
              <Tooltip key={i}>
                <TooltipTrigger>
                  <div 
                    className="w-8 h-8 rounded-full border-2 border-background flex items-center justify-center text-xs text-zinc-950 font-bold transition-all hover:-translate-y-1 cursor-help"
                    style={{ backgroundColor: u.color }}
                  >
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs font-semibold">{u.name} <span className="text-muted-foreground font-normal">(Active)</span></p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        )}
        
        {user && documentId && role && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsShareOpen(true)}
            className="flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
          >
            <UserPlus className="w-4 h-4" /> Share
          </Button>
        )}

        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user.name || user.email}</span>
            <Button variant="outline" size="sm" className="transition-all hover:scale-105" onClick={() => signOut({ callbackUrl: '/' })}>Logout</Button>
          </div>
        ) : (
          <Link href="/auth">
            <Button size="sm" className="transition-all hover:scale-105">Login / Register</Button>
          </Link>
        )}
      </div>

      {isShareOpen && documentId && role && (
        <ShareModal 
          documentId={documentId} 
          userRole={role} 
          onClose={() => setIsShareOpen(false)} 
        />
      )}
    </header>
  );
};
