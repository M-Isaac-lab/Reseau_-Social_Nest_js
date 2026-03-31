'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import type { User } from './types';
import { auth as authApi, setTokens, clearTokens } from './api';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signin: (email: string, password: string) => Promise<void>;
  signup: (
    username: string,
    email: string,
    password: string,
  ) => Promise<void>;
  signout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    try {
      const res = await authApi.getProfile();
      setUser(res.data);
    } catch {
      setUser(null);
      clearTokens();
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const res = await authApi.getProfile();
          if (!cancelled) setUser(res.data);
        } catch {
          if (!cancelled) {
            setUser(null);
            clearTokens();
          }
        }
      }
      if (!cancelled) setLoading(false);
    };
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const signin = async (email: string, password: string) => {
    const res = await authApi.signin({ email, password });
    const data = res.data;
    setTokens(data.access_token, data.refresh_token);
    await refreshUser();
    router.push('/feed');
  };

  const signup = async (
    username: string,
    email: string,
    password: string,
  ) => {
    await authApi.signup({ username, email, password });
    router.push('/signin');
  };

  const signout = () => {
    clearTokens();
    setUser(null);
    router.push('/signin');
  };

  return (
    <AuthContext value={{ user, loading, signin, signup, signout, refreshUser }}>
      {children}
    </AuthContext>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
