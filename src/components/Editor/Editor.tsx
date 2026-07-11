'use client';

import { useEffect, useState } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import * as Y from 'yjs';
// @ts-expect-error - y-websocket package.json exports mapping is not fully resolved in this workspace's TypeScript configuration
import { WebsocketProvider } from 'y-websocket';
import { Toolbar } from './Toolbar';
import { useEditorStore } from '@/store/useEditorStore';
import { VersionHistory } from '../Document/VersionHistory';
import { AIChatWidget } from '../Document/AIChatWidget';

// Simple random color generator for cursors
const colors = ['#958DF1', '#F98181', '#FBCE76', '#EA7186', '#F5D0C5'];
const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];
const getRandomName = () => `User ${Math.floor(Math.random() * 1000)}`;

const TiptapEditor = ({ 
  provider, 
  ydoc, 
  role,
  onToggleVersions
}: { 
  provider: WebsocketProvider, 
  ydoc: Y.Doc, 
  role: string,
  onToggleVersions: () => void
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false as never, // History is managed by Yjs
      }),
      Collaboration.configure({
        document: ydoc,
      }),
      CollaborationCursor.configure({
        provider,
        user: {
          name: provider.awareness.getLocalState()?.user?.name || 'Unknown',
          color: provider.awareness.getLocalState()?.user?.color || '#000000',
        },
      }),
    ],
    content: '',
    editable: role !== 'VIEWER',
    editorProps: {
      attributes: {
        class: 'prose prose-zinc dark:prose-invert focus:outline-none w-full text-foreground',
      },
    },
  });

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 flex-1 relative">
      <div className="border-b bg-card shadow-sm z-10">
        <Toolbar editor={editor} onToggleVersions={onToggleVersions} />
      </div>
      <div className="flex-1 overflow-y-auto p-8 flex justify-center">
        {/* A4 Page Container */}
        <div className="w-[21cm] min-h-[29.7cm] bg-background border border-zinc-200 dark:border-zinc-800 shadow-md p-[2.5cm] transition-all hover:shadow-lg focus-within:ring-1 focus-within:ring-zinc-400 dark:focus-within:ring-zinc-600 animate-in fade-in duration-300">
          <EditorContent editor={editor} />
        </div>
      </div>
      <AIChatWidget editor={editor} />
    </div>
  );
};

export const CollaborativeEditor = ({ 
  documentId, 
  token, 
  role,
  username
}: { 
  documentId: string, 
  token: string, 
  role: string,
  username?: string | null
}) => {
  const [setup, setSetup] = useState<{ provider: WebsocketProvider, ydoc: Y.Doc } | null>(null);
  const { setStatus, setActiveUsers } = useEditorStore();
  const [isVersionOpen, setIsVersionOpen] = useState(false);

  useEffect(() => {
    // 1. Initialize Yjs document
    const ydoc = new Y.Doc();

    // 2. Connect to the custom WebSocket server
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'wss://docsurf-ws-production.up.railway.app';
    const wsProvider = new WebsocketProvider(
      wsUrl,
      `${documentId}?token=${token}`,
      ydoc
    );

    // 3. Setup user state
    const color = getRandomColor();
    const name = username || getRandomName();
    
    wsProvider.awareness.setLocalStateField('user', {
      name,
      color,
    });

    // 4. Listen to connection status
    wsProvider.on('status', ({ status }: { status: 'connecting' | 'connected' | 'disconnected' }) => {
      setStatus(status);
    });

    // 5. Listen to awareness (user presence) changes
    wsProvider.awareness.on('change', () => {
      const states = Array.from(wsProvider.awareness.getStates().entries()) as [number, any][];
      const users = states.map(([clientId, state]: [number, any]) => ({
        clientId,
        name: state.user?.name || 'Unknown',
        color: state.user?.color || '#000000',
      }));
      setActiveUsers(users);
    });

    // Hook up a client-side isSaving update indicator
    let saveIndicatorTimeout: NodeJS.Timeout | null = null;
    ydoc.on('update', () => {
      useEditorStore.getState().setIsSaving(true);
      if (saveIndicatorTimeout) clearTimeout(saveIndicatorTimeout);
      saveIndicatorTimeout = setTimeout(() => {
        useEditorStore.getState().setIsSaving(false);
      }, 1500); // 1.5 seconds after typing stops, show Synced again
    });

    setSetup({ provider: wsProvider, ydoc });

    return () => {
      if (saveIndicatorTimeout) clearTimeout(saveIndicatorTimeout);
      wsProvider.destroy();
      ydoc.destroy();
    };
  }, [documentId, token, setStatus, setActiveUsers, username]);

  if (!setup) {
    return <div className="p-4 text-center">Initializing editor...</div>;
  }

  return (
    <div className="flex-1 flex overflow-hidden relative">
      <div className="flex-1 overflow-y-auto">
        <TiptapEditor 
          provider={setup.provider} 
          ydoc={setup.ydoc} 
          role={role} 
          onToggleVersions={() => setIsVersionOpen(true)} 
        />
      </div>
      {isVersionOpen && (
        <VersionHistory 
          documentId={documentId} 
          ydoc={setup.ydoc} 
          onClose={() => setIsVersionOpen(false)} 
        />
      )}
    </div>
  );
};
