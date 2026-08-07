import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

// Socket connects to the API origin (VITE_API_URL without the trailing /api).
const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const ORIGIN = API.replace(/\/api\/?$/, '');

const EMPTY = {
  onlineRestaurantIds: [],
  deviceCounts: {},
  totalDevices: 0,
  totalRestaurantsOnline: 0,
  totalUsersOnline: 0,
};

const PresenceContext = createContext(null);
export const usePresence = () => useContext(PresenceContext) || { connected: false, ...EMPTY, isOnline: () => false, deviceCount: () => 0 };

export function PresenceProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [snapshot, setSnapshot] = useState(EMPTY);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setSnapshot(EMPTY);
      setConnected(false);
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = io(ORIGIN, {
      query: { token, superAdmin: 'true' },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('presence:update', (snap) => snap && setSnapshot(snap));

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [isAuthenticated]);

  const value = useMemo(() => {
    const onlineSet = new Set(snapshot.onlineRestaurantIds || []);
    return {
      ...snapshot,
      connected,
      isOnline: (id) => onlineSet.has(id),
      deviceCount: (id) => (snapshot.deviceCounts || {})[id] || 0,
    };
  }, [snapshot, connected]);

  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>;
}
