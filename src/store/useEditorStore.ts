import { create } from 'zustand';

interface EditorState {
  status: 'connecting' | 'connected' | 'disconnected';
  isSaving: boolean;
  activeUsers: { clientId: number; name: string; color: string }[];
  setStatus: (status: 'connecting' | 'connected' | 'disconnected') => void;
  setIsSaving: (isSaving: boolean) => void;
  setActiveUsers: (users: { clientId: number; name: string; color: string }[]) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  status: 'disconnected',
  isSaving: false,
  activeUsers: [],
  setStatus: (status) => set({ status }),
  setIsSaving: (isSaving) => set({ isSaving }),
  setActiveUsers: (users) => set({ activeUsers: users }),
}));
