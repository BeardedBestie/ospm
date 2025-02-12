import { create } from 'zustand';
import { User } from '@supabase/supabase-js';

interface UserProfile {
  role: 'admin' | 'user' | 'viewer';
  status: 'pending' | 'active' | 'disabled';
}

interface AppState {
  user: User | null;
  userProfile: UserProfile | null;
  theme: 'light' | 'dark';
  setUser: (user: User | null) => void;
  setUserProfile: (profile: UserProfile | null) => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  userProfile: null,
  theme: 'light',
  setUser: (user) => set({ user }),
  setUserProfile: (profile) => set({ userProfile: profile }),
  setTheme: (theme) => set({ theme }),
}));