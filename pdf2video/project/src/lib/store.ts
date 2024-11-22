import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  subscription: {
    plan: 'free' | 'pro' | 'enterprise';
    status: 'active' | 'inactive' | 'cancelled';
    validUntil: string;
  };
  apiKeys: {
    openai?: string;
    groq?: string;
    gemini?: string;
  };
  settings: {
    notifications: boolean;
    theme: 'light' | 'dark';
    defaultModel: string;
  };
}

interface Video {
  id: string;
  title: string;
  url: string;
  createdAt: string;
  duration: number;
  thumbnail?: string;
}

interface AuthState {
  user: User | null;
  videos: Video[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  addVideo: (video: Video) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      videos: [],
      isAuthenticated: false,
      isLoading: false,
      login: async (email, password) => {
        set({ isLoading: true });
        try {
          // Demo account check
          if (email === 'user@example.com' && password === 'pass') {
            const demoUser: User = {
              id: '1',
              email: 'user@example.com',
              name: 'Demo User',
              subscription: {
                plan: 'free',
                status: 'active',
                validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              },
              apiKeys: {},
              settings: {
                notifications: true,
                theme: 'light',
                defaultModel: 'groq',
              },
            };
            set({ user: demoUser, isAuthenticated: true });
          } else {
            throw new Error('Invalid credentials');
          }
        } finally {
          set({ isLoading: false });
        }
      },
      register: async (email, password, name) => {
        set({ isLoading: true });
        try {
          // Demo registration
          const newUser: User = {
            id: Date.now().toString(),
            email,
            name,
            subscription: {
              plan: 'free',
              status: 'active',
              validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            },
            apiKeys: {},
            settings: {
              notifications: true,
              theme: 'light',
              defaultModel: 'groq',
            },
          };
          set({ user: newUser, isAuthenticated: true });
        } finally {
          set({ isLoading: false });
        }
      },
      logout: () => {
        set({ user: null, isAuthenticated: false });
      },
      updateUser: (data) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        }));
      },
      addVideo: (video) => {
        set((state) => ({
          videos: [video, ...state.videos],
        }));
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);