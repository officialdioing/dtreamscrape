'use client';

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from '@/src/admin/providers/GolangAuthProvider';

type SiteContent = any;

type SiteContentContextValue = {
  siteContent: SiteContent;
  setSiteContent: (siteContent: SiteContent) => void;
  refreshContent: () => Promise<void>;
  isLoading: boolean;
};

const SiteContentContext = createContext<SiteContentContextValue | null>(null);

const DEFAULT_CONTENT = {
  home: {
    hero: { slides: [] },
    brandIntro: {},
    statistics: { stats: [] },
    servicesPreview: { services: [] },
    featuredEvents: {}
  },
  about: {
    hero: {},
    story: {},
    philosophy: {},
    team: {}
  },
  services: {
    hero: {},
    introduction: {}
  },
  contact: {
    hero: {},
    information: {},
    form: {}
  }
};

export function SiteContentProvider({ children }: { children: React.ReactNode }) {
  const [siteContent, setSiteContentState] = useState<SiteContent>(DEFAULT_CONTENT);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const fetchContent = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/site-content', { cache: 'no-store' });
      const json = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        console.error('❌ Error loading site content:', json?.error || res.statusText);
        return;
      }

      // Transform the grouped data into our content structure
      const transformed: any = { ...DEFAULT_CONTENT };

      Object.entries(json.grouped || {}).forEach(([key, items]: [string, any]) => {
        const [page, section] = key.split('_');

        if (!transformed[page]) {
          transformed[page] = {};
        }
        if (!transformed[page][section]) {
          transformed[page][section] = {};
        }

        // Extract values from the nested structure
        Object.entries(items).forEach(([contentKey, data]: [string, any]) => {
          transformed[page][section][contentKey] = data.value;
        });
      });

      setSiteContentState(transformed);
    } catch (error) {
      console.error('❌ Error loading site content:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      void fetchContent();
    }
  }, [isAuthenticated, fetchContent]);

  const setSiteContent = async (next: SiteContent) => {
    setSiteContentState(next);
    // Could also persist to localStorage as backup
    try {
      localStorage.setItem('dreamscape_admin_siteContent', JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const value = useMemo<SiteContentContextValue>(
    () => ({
      siteContent: isLoading ? DEFAULT_CONTENT : siteContent,
      setSiteContent,
      refreshContent: fetchContent,
      isLoading
    }),
    [siteContent, isLoading, fetchContent]
  );

  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>;
}

export function useSiteContent() {
  const ctx = useContext(SiteContentContext);
  if (!ctx) throw new Error('useSiteContent must be used within SiteContentProvider');
  return ctx;
}
