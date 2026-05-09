'use client';

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from '@/src/admin/providers/GolangAuthProvider';
import { getAccessToken } from '@/src/lib/golang-auth';

type EventItem = any;

type EventsContextValue = {
  events: EventItem[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createEvent: (draft: {
    title: string;
    event_date?: string | null;
    event_type: string;
    status?: 'draft' | 'published';
    featured_image?: string | null;
  }) => Promise<EventItem>;
  deleteEvent: (id: string) => Promise<void>;
};

const EventsContext = createContext<EventsContextValue | null>(null);

export function EventsProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8080';
      const token = getAccessToken();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${backendUrl}/api/admin/events`, {
        cache: 'no-store',
        signal: controller.signal,
        headers
      });

      clearTimeout(timeoutId);

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load events');
      setEvents(json.items || []);
    } catch (err) {
      const message = err instanceof Error
        ? (err.name === 'AbortError' ? 'Request timeout - events may be disabled' : err.message)
        : 'Unknown error';
      // Don't set error state - just log it and use empty events
      console.warn('Events not available (table may not exist):', message);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      void refresh();
    }
  }, [isAuthenticated, refresh]);

  const createEvent = async (draft: {
    title: string;
    event_date?: string | null;
    event_type: string;
    status?: 'draft' | 'published';
    featured_image?: string | null;
  }) => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8080';
    const token = getAccessToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${backendUrl}/api/admin/events`, {
      method: 'POST',
      headers,
      body: JSON.stringify(draft),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || 'Failed to create event');
    const newEvent = json.item;
    setEvents((prev) => [...prev, newEvent]);
    return newEvent;
  };

  const deleteEvent = async (id: string) => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8080';
    const token = getAccessToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${backendUrl}/api/admin/events/${id}`, {
      method: 'DELETE',
      headers
    });
    if (!res.ok) throw new Error('Failed to delete event');
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const value = useMemo<EventsContextValue>(
    () => ({
      events,
      isLoading,
      error,
      refresh,
      createEvent,
      deleteEvent,
    }),
    [events, isLoading, error, refresh]
  );

  return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>;
}

export function useEvents() {
  const context = useContext(EventsContext);
  if (!context) {
    return {
      events: [],
      isLoading: false,
      error: null,
      refresh: async () => {},
      createEvent: async () => { throw new Error('EventsProvider not found'); },
      deleteEvent: async () => { throw new Error('EventsProvider not found'); },
    };
  }
  return context;
}
