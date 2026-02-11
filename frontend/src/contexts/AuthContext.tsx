'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { api, User, LoginDto, RegisterAdminDto } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (dto: LoginDto) => Promise<void>;
  register: (dto: RegisterAdminDto) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const idleTimeoutId = useRef<number | null>(null);
  const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      refreshUser().catch(() => {
        localStorage.removeItem('token');
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const refreshUser = async () => {
    try {
      const userData = await api.auth.me();
      setUser(userData);
      setLoading(false);
    } catch (error) {
      localStorage.removeItem('token');
      setUser(null);
      setLoading(false);
      throw error;
    }
  };

  const login = async (dto: LoginDto) => {
    const response = await api.auth.login(dto);
    localStorage.setItem('token', response.access_token);
    setUser(response.user);
  };

  const register = async (dto: RegisterAdminDto) => {
    const response = await api.auth.register(dto);
    localStorage.setItem('token', response.access_token);
    setUser(response.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // Auto-logout after 15 minutes of inactivity
  useEffect(() => {
    if (!user) {
      if (idleTimeoutId.current !== null) {
        window.clearTimeout(idleTimeoutId.current);
        idleTimeoutId.current = null;
      }
      return;
    }

    const handleIdle = async () => {
      try {
        await api.auth.updateStatus(false);
      } catch {
        // Ignore errors on background status update
      }
      logout();
    };

    const resetTimer = () => {
      if (!user) return;
      if (idleTimeoutId.current !== null) {
        window.clearTimeout(idleTimeoutId.current);
      }
      idleTimeoutId.current = window.setTimeout(handleIdle, IDLE_TIMEOUT_MS);
    };

    const events: (keyof WindowEventMap)[] = ['mousemove', 'keydown', 'click', 'focus'];
    events.forEach((event) => window.addEventListener(event, resetTimer));

    resetTimer();

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer));
      if (idleTimeoutId.current !== null) {
        window.clearTimeout(idleTimeoutId.current);
        idleTimeoutId.current = null;
      }
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

