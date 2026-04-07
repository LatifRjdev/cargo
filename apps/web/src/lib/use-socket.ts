'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface Notification {
  id: string;
  event: string;
  message: string;
  createdAt: string;
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace('/api', '');

    const socket = io(`${apiUrl}/events`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      setConnected(true);
      console.log('[WS] Connected');
    });

    socket.on('disconnect', () => {
      setConnected(false);
      console.log('[WS] Disconnected');
    });

    socket.on('notification', (data: Notification) => {
      setNotifications(prev => [data, ...prev].slice(0, 20));
      setUnreadCount(prev => prev + 1);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const clearUnread = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return { connected, notifications, unreadCount, clearUnread };
}
