'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});


export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const token = localStorage.getItem('token'); // Matches AuthContext.tsx
    if (!token) return;

    const url =
      process.env.NEXT_PUBLIC_API_URL ||
      (process.env.NODE_ENV === 'production'
        ? 'https://api.intrabox.com.ng'
        : 'http://localhost:3000');
    console.log('Socket: Attempting connection to', url, 'with token', token.substring(0, 10) + '...');
    
    const newSocket = io(url, {
      auth: {
        token,
      },
      transports: ['polling', 'websocket'], // Try polling first for cPanel compatibility
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Socket connected:', newSocket.id);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Socket disconnected');
    });

    newSocket.on('conversation_updated', (data) => {
      console.log('RECEIVED conversation_updated:', data);
      // Play a short notification beep using Web Audio API
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      } catch {
        // Audio not available (e.g. no user interaction yet) — silently ignore
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
