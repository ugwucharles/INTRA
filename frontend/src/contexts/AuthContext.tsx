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
  const tabAwayTimeoutId = useRef<number | null>(null);
  const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
  const TAB_AWAY_TIMEOUT_MS = 90 * 1000; // 90 seconds

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
    
    try {
      await api.auth.updateStatus(true);
    } catch {
      // Ignore initial status update errors
    }
  };

  const register = async (dto: RegisterAdminDto) => {
    const response = await api.auth.register(dto);
    localStorage.setItem('token', response.access_token);
    setUser(response.user);
  };

  const logout = async () => {
    if (user) {
      try {
        await api.auth.updateStatus(false);
      } catch {
        // Ignore error when logging out
      }
    }
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

    // Handle tab switching (visibilitychange) and closing the window
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is hidden (user switched tabs or minimized) -> wait 90 seconds before going offline
        if (tabAwayTimeoutId.current !== null) {
          window.clearTimeout(tabAwayTimeoutId.current);
        }
        tabAwayTimeoutId.current = window.setTimeout(() => {
          api.auth.updateStatus(false).catch(() => {});
        }, TAB_AWAY_TIMEOUT_MS);
      } else {
        // Tab is active again -> cancel the 90s countdown, tell server we're online
        if (tabAwayTimeoutId.current !== null) {
          window.clearTimeout(tabAwayTimeoutId.current);
          tabAwayTimeoutId.current = null;
        }
        api.auth.updateStatus(true).catch(() => {});
        resetTimer();
      }
    };

    const handleBeforeUnload = () => {
      // User is closing the tab/window -> tell server we're offline
      // Note: We use keepalive or a synchronous-like request if possible, but fetch usually fires okay if simple
      api.auth.updateStatus(false).catch(() => {});
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    resetTimer();

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      if (idleTimeoutId.current !== null) {
        window.clearTimeout(idleTimeoutId.current);
        idleTimeoutId.current = null;
      }
      if (tabAwayTimeoutId.current !== null) {
        window.clearTimeout(tabAwayTimeoutId.current);
        tabAwayTimeoutId.current = null;
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

