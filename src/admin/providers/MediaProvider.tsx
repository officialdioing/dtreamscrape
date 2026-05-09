'use client';

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from '@/src/admin/providers/GolangAuthProvider';
import { getAccessToken } from '@/src/lib/golang-auth';

type MediaItem = any;

type MediaContextValue = {
  media: MediaItem[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createMedia: (draft: {
    name: string;
    url: string;
    type?: string;
    mime_type?: string | null;
    size?: number | null;
    width?: number | null;
    height?: number | null;
    alt_text?: string | null;
    folder?: string | null;
    tags?: unknown[] | null;
  }) => Promise<MediaItem>;
  updateMedia: (
    id: string,
    draft: {
      name: string;
      url: string;
      type?: string;
      mime_type?: string | null;
      size?: number | null;
      width?: number | null;
      height?: number | null;
      alt_text?: string | null;
      folder?: string | null;
      tags?: unknown[] | null;
    }
  ) => Promise<MediaItem>;
  deleteMedia: (id: string) => Promise<void>;
};

const MediaContext = createContext<MediaContextValue | null>(null);

export function MediaProvider({ children }: { children: React.ReactNode }) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError(null);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8080';
      const token = getAccessToken();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${backendUrl}/api/admin/media-library`, {
        cache: 'no-store',
        headers
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load media');
      setMedia(json.items || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error loading media:', message);
      setError(message);
      setMedia([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      void refresh();
    }
  }, [isAuthenticated, refresh]);

  const createMedia: MediaContextValue['createMedia'] = async (draft) => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8080';
    const token = getAccessToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${backendUrl}/api/admin/media-library`, {
      method: 'POST',
      headers,
      body: JSON.stringify(draft),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || 'Failed to create media');
    setMedia((prev) => [json.item, ...prev]);
    return json.item;
  };

  const updateMedia: MediaContextValue['updateMedia'] = async (id, draft) => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8080';
    const token = getAccessToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${backendUrl}/api/admin/media-library/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(draft),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || 'Failed to update media');
    setMedia((prev) => prev.map((m: any) => (m.id === id ? json.item : m)));
    return json.item;
  };

  const deleteMedia: MediaContextValue['deleteMedia'] = async (id) => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8080';
    const token = getAccessToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${backendUrl}/api/admin/media-library/${id}`, {
      method: 'DELETE',
      headers
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || 'Failed to delete media');
    setMedia((prev) => prev.filter((m: any) => m.id !== id));
  };

  const value = useMemo<MediaContextValue>(
    () => ({ media, isLoading, error, refresh, createMedia, updateMedia, deleteMedia }),
    [media, isLoading, error, refresh]
  );

  return <MediaContext.Provider value={value}>{children}</MediaContext.Provider>;
}

export function useMedia() {
  const ctx = useContext(MediaContext);
  if (!ctx) {
    // Return default values instead of throwing to prevent crashes
    return {
      media: [],
      isLoading: false,
      error: null,
      refresh: async () => {},
      createMedia: async () => { throw new Error('MediaProvider not found'); },
      updateMedia: async () => { throw new Error('MediaProvider not found'); },
      deleteMedia: async () => { throw new Error('MediaProvider not found'); },
    };
  }
  return ctx;
}
