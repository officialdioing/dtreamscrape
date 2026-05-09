'use client';

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from '@/src/admin/providers/GolangAuthProvider';

type SettingsContextValue = {
  settings: any;
  isLoading: boolean;
  refresh: () => Promise<void>;
  saveSettings: (next: any) => Promise<void>;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const mapFromDb = (row: any) => {
    const social = row?.social_links || {};
    const seo = row?.seo_settings || {};
    return {
      companyName: row?.site_name ?? '',
      email: row?.contact_email ?? '',
      phone: row?.contact_phone ?? '',
      address: row?.contact_address ?? '',
      whatsapp: row?.whatsapp_number ?? '',
      instagram: social?.instagram ?? '',
      facebook: social?.facebook ?? '',
      metaTitle: seo?.meta_title ?? seo?.metaTitle ?? '',
      metaDescription: seo?.meta_description ?? seo?.metaDescription ?? '',
      __raw: row,
    };
  };

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/site-settings', { cache: 'no-store' });
      const json = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        const message = json?.error || res.statusText || 'Failed to load settings';
        console.error('Failed to load settings:', message);
        setError(message);
        // Keep UI usable with defaults when DB is unavailable.
        setSettings(mapFromDb({}));
        return;
      }
      setError(null);
      setSettings(mapFromDb(json.settings));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load settings';
      console.error('Failed to load settings:', message);
      setError(message);
      setSettings(mapFromDb({}));
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      void refresh();
    }
  }, [isAuthenticated, refresh]);

  const saveSettings: SettingsContextValue['saveSettings'] = async (next) => {
    const payload = {
      site_name: next.companyName,
      contact_email: next.email,
      contact_phone: next.phone,
      contact_address: next.address,
      whatsapp_number: next.whatsapp || next.phone,
      social_links: {
        instagram: next.instagram || '',
        facebook: next.facebook || '',
      },
      seo_settings: {
        meta_title: next.metaTitle || '',
        meta_description: next.metaDescription || '',
      },
    };

    const res = await fetch('/api/admin/site-settings', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || 'Failed to save settings');
    setSettings(mapFromDb(json.settings));
  };

  const value = useMemo<SettingsContextValue>(
    () => ({ settings, isLoading, refresh, saveSettings }),
    [settings, isLoading, refresh]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
