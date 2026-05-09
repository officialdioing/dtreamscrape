'use client';

import { useEffect, useState } from 'react';
import type { SiteContentData, UsePageContentReturn, UseSiteContentReturn } from '@/src/types';

export function useSiteContent(page: string, section?: string): UseSiteContentReturn {
  const [content, setContent] = useState<SiteContentData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ page });
        if (section) {
          params.append('section', section);
        }

        const res = await fetch(`/api/site-content?${params.toString()}`, {
          cache: 'no-store'
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to fetch content');
        }

        const json = await res.json();

        // Transform grouped data into flat object
        const transformed: SiteContentData = {};
        const key = `${page}_${section || ''}`;

        if (json.grouped && json.grouped[key]) {
          Object.entries(json.grouped[key]).forEach(([contentKey, data]) => {
            const value = typeof data === 'object' && data !== null && 'value' in data ? data.value : data;
            transformed[contentKey] = value;
          });
        }

        setContent(transformed);
      } catch (err: unknown) {
        console.error('Error fetching site content:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [page, section]);

  return { content, isLoading, error };
}

// Hook for getting multiple sections from a page
export function usePageContent(page: string): UsePageContentReturn {
  const [content, setContent] = useState<Record<string, SiteContentData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/site-content?page=${page}`, {
          cache: 'no-store'
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to fetch content');
        }

        const json = await res.json();

        // Transform all grouped data for this page
        const transformed: Record<string, SiteContentData> = {};

        Object.entries(json.grouped || {}).forEach(([key, items]) => {
          if (key.startsWith(`${page}_`)) {
            const section = key.replace(`${page}_`, '');
            transformed[section] = {};

            if (typeof items === 'object' && items !== null) {
              Object.entries(items).forEach(([contentKey, data]) => {
                const value = typeof data === 'object' && data !== null && 'value' in data ? data.value : data;
                transformed[section][contentKey] = value;
              });
            }
          }
        });

        setContent(transformed);
      } catch (err: unknown) {
        console.error('Error fetching page content:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [page]);

  return { content, isLoading, error };
}
