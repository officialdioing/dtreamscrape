'use client';

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from '@/src/admin/providers/GolangAuthProvider';
import { getAccessToken } from '@/src/lib/golang-auth';

export type ServiceItem = {
  id: string;
  slug: string;
  category?: string | null;
  title: string;
  subtitle?: string | null;
  description: string;
  image?: string | null;
  list_items?: string[];
  cta_text?: string | null;
  cta_link?: string | null;
  status?: string;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
};

type ServicesContextValue = {
  services: ServiceItem[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  createService: (payload: Partial<ServiceItem>) => Promise<ServiceItem>;
  updateService: (id: string, payload: Partial<ServiceItem>) => Promise<ServiceItem>;
  deleteService: (id: string) => Promise<void>;
};

const ServicesContext = createContext<ServicesContextValue | null>(null);

export function ServicesProvider({ children }: { children: React.ReactNode }) {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8080';
      const token = getAccessToken();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${backendUrl}/api/admin/services`, {
        cache: 'no-store',
        headers
      });
      const json = await res.json();
      if (res.ok) {
        setServices(json.items || []);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      void refresh();
    }
  }, [isAuthenticated, refresh]);

  const createService = async (payload: Partial<ServiceItem>) => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8080';
    const token = getAccessToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${backendUrl}/api/admin/services`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to create service');
    setServices((prev) => [json.item, ...prev]);
    return json.item;
  };

  const updateService = async (id: string, payload: Partial<ServiceItem>) => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8080';
    const token = getAccessToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let res = await fetch(`${backendUrl}/api/admin/services/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    });
    let json = await res.json();
    if (!res.ok && payload.slug) {
      res = await fetch(`${backendUrl}/api/admin/services/${payload.slug}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });
      json = await res.json();
    }
    if (!res.ok) throw new Error(json.error || 'Failed to update service');
    setServices((prev) => prev.map((s) => (s.id === json.item.id ? json.item : s)));
    return json.item;
  };

  const deleteService = async (id: string) => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8080';
    const token = getAccessToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${backendUrl}/api/admin/services/${id}`, {
      method: 'DELETE',
      headers
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to delete service');
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  const value = useMemo<ServicesContextValue>(
    () => ({ services, isLoading, refresh, createService, updateService, deleteService }),
    [services, isLoading, refresh]
  );

  return <ServicesContext.Provider value={value}>{children}</ServicesContext.Provider>;
}

export function useServices() {
  const ctx = useContext(ServicesContext);
  if (!ctx) throw new Error('useServices must be used within ServicesProvider');
  return ctx;
}
