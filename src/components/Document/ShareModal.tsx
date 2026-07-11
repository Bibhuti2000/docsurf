'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, UserPlus, Trash2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Collaborator = {
  id: string;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
};

export const ShareModal = ({
  documentId,
  userRole,
  onClose
}: {
  documentId: string;
  userRole: 'OWNER' | 'EDITOR' | 'VIEWER';
  onClose: () => void;
}) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'EDITOR' | 'VIEWER'>('EDITOR');
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchCollaborators = useCallback(async () => {
    try {
      const res = await fetch(`/api/documents/${documentId}/share`);
      if (res.ok) {
        setCollaborators(await res.json());
      }
    } catch (err) {
      console.error('Failed to load collaborators:', err);
    }
  }, [documentId]);

  useEffect(() => {
    fetchCollaborators();
  }, [fetchCollaborators]);

  const handleAddCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/documents/${documentId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), role })
      });

      if (res.ok) {
        setSuccess('Collaborator added successfully!');
        setEmail('');
        fetchCollaborators();
      } else {
        const text = await res.text();
        setError(text || 'Failed to add collaborator.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeAccess = async (roleId: string) => {
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/documents/${documentId}/share?roleId=${roleId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setSuccess('Access revoked successfully.');
        fetchCollaborators();
      } else {
        const text = await res.text();
        setError(text || 'Failed to revoke access.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-all animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-card border rounded-xl shadow-xl p-6 transition-all scale-95 md:scale-100 animate-in slide-in-from-bottom-4 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-foreground" />
            <h2 className="text-lg font-bold text-foreground">Share Document</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add Collaborator Form (Owners only) */}
        {userRole === 'OWNER' && (
          <form onSubmit={handleAddCollaborator} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Collaborator Email
              </label>
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full text-sm px-3 py-2 border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Access Level
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'EDITOR' | 'VIEWER')}
                  className="w-full text-sm px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                >
                  <option value="EDITOR">Editor (Can edit)</option>
                  <option value="VIEWER">Viewer (Read-only)</option>
                </select>
              </div>
              <div className="pt-5">
                <Button type="submit" disabled={isLoading} className="transition-all hover:scale-105 active:scale-95">
                  {isLoading ? 'Adding...' : 'Invite'}
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* Message Alert states */}
        {error && (
          <div className="mt-4 p-3 bg-destructive/15 border border-destructive/20 text-destructive text-sm rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 p-3 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-foreground text-sm rounded-lg">
            {success}
          </div>
        )}

        {/* Collaborators List */}
        <div className="mt-6 space-y-3">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            Who has access
          </label>
          <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
            {collaborators.map((c) => (
              <div 
                key={c.id} 
                className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-foreground">
                    {(c.user.name || c.user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {c.user.name || c.user.email}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {c.user.email}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 border rounded-full bg-background text-muted-foreground flex items-center gap-1 font-medium">
                    {c.role === 'OWNER' ? (
                      <>
                        <Shield className="w-3 h-3 text-zinc-500" /> Owner
                      </>
                    ) : (
                      <>
                        <Shield className="w-3 h-3 text-zinc-400" /> {c.role.toLowerCase()}
                      </>
                    )}
                  </span>
                  {userRole === 'OWNER' && c.role !== 'OWNER' && (
                    <button 
                      onClick={() => handleRevokeAccess(c.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      title="Revoke access"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
