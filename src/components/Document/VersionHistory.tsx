'use client';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';

type Version = {
  id: string;
  name: string;
  createdAt: string;
};

import * as Y from 'yjs';

export const VersionHistory = ({ 
  documentId, 
  ydoc,
  onClose
}: { 
  documentId: string; 
  ydoc?: Y.Doc;
  onClose: () => void;
}) => {
  const [versions, setVersions] = useState<Version[]>([]);
  const [name, setName] = useState('');

  const fetchVersions = useCallback(async () => {
    try {
      const res = await fetch(`/api/documents/${documentId}/versions`);
      if (res.ok) {
        setVersions(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  }, [documentId]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const saveVersion = async () => {
    if (!name.trim()) return;
    try {
      let base64Content = '';
      if (ydoc) {
        const stateVector = Y.encodeStateAsUpdate(ydoc);
        let binary = '';
        const len = stateVector.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(stateVector[i]);
        }
        base64Content = window.btoa(binary);
      }

      await fetch(`/api/documents/${documentId}/versions`, {
        method: 'POST',
        body: JSON.stringify({ name, content: base64Content }),
        headers: { 'Content-Type': 'application/json' }
      });
      setName('');
      fetchVersions();
    } catch (err) {
      console.error(err);
    }
  };

  const restoreVersion = async (versionId: string) => {
    if (!ydoc) return;
    try {
      const res = await fetch(`/api/documents/${documentId}/versions/${versionId}`);
      if (!res.ok) throw new Error('Failed to fetch version content');
      
      const arrayBuffer = await res.arrayBuffer();
      const update = new Uint8Array(arrayBuffer);
      
      const tempDoc = new Y.Doc();
      Y.applyUpdate(tempDoc, update);
      
      const activeFragment = ydoc.getXmlFragment('default');
      const tempFragment = tempDoc.getXmlFragment('default');
      
      ydoc.transact(() => {
        activeFragment.delete(0, activeFragment.length);
        
        const children = tempFragment.toArray() as unknown[];
        for (let i = 0; i < children.length; i++) {
          const child = children[i] as { clone?: () => Y.XmlElement<Record<string, string>> | Y.XmlText };
          if (child && typeof child.clone === 'function') {
            const cloned = child.clone();
            if (cloned) {
              activeFragment.insert(i, [cloned]);
            }
          }
        }
      });
      alert('Version restored successfully!');
      onClose(); // Automatically close versions sheet after restore
    } catch (err) {
      console.error(err);
      alert('Failed to restore version');
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-background/40 backdrop-blur-sm transition-all animate-in fade-in duration-200">
      {/* Close Backdrop Click handler */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} />
      
      {/* Sliding Sheet Panel */}
      <div className="relative w-80 bg-card border-l h-full shadow-2xl p-6 flex flex-col transition-all animate-in slide-in-from-right duration-300">
        
        {/* Title & Close */}
        <div className="flex items-center justify-between pb-4 border-b">
          <h3 className="font-bold text-foreground text-lg">Version History</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="p-1 h-auto hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
        
        {/* Save Version Form */}
        <div className="mt-4 flex gap-2 mb-6">
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Version name..."
            className="flex-1 text-sm px-3 py-1.5 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
          />
          <Button size="sm" onClick={saveVersion} className="transition-all hover:scale-105 active:scale-95">Save</Button>
        </div>

        {/* Versions List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {versions.map(v => (
            <div key={v.id} className="p-3 bg-zinc-50 dark:bg-zinc-900 border rounded-lg shadow-sm transition-all hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700">
              <div className="font-semibold text-sm text-foreground">{v.name}</div>
              <div className="text-xs text-muted-foreground mb-3">{new Date(v.createdAt).toLocaleString()}</div>
              <Button variant="outline" size="sm" className="w-full text-xs transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => restoreVersion(v.id)}>
                Restore
              </Button>
            </div>
          ))}
          {versions.length === 0 && (
            <div className="text-xs text-muted-foreground text-center mt-8">No saved versions yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};
