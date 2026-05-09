'use client';

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from '@/src/admin/providers/GolangAuthProvider';

type InquiryItem = any;

type InquiriesContextValue = {
  inquiries: InquiryItem[];
  setInquiries: React.Dispatch<React.SetStateAction<InquiryItem[]>>;
  isLoading: boolean;
  refresh: () => Promise<void>;
  deleteInquiry: (id: string) => Promise<void>;
  updateStatus: (id: string, status: string) => Promise<void>;
};

const InquiriesContext = createContext<InquiriesContextValue | null>(null);

export function InquiriesProvider({ children }: { children: React.ReactNode }) {
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/bookings', { cache: 'no-store' });
      const json = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        console.error('Failed to load bookings:', json?.error || res.statusText);
        setInquiries([]);
        return;
      }

      const mapped = (json.items || []).map((b: any) => ({
        id: b.id,
        name: `${b.first_name ?? ''} ${b.last_name ?? ''}`.trim(),
        email: b.email,
        phone: b.phone,
        eventType: Array.isArray(b.event_types) && b.event_types.length ? b.event_types.join(', ') : '—',
        consultationDate: b.consultation_date ?? null,
        consultationTime: b.consultation_time ?? null,
        eventDate: b.event_date ?? null,
        eventLocation: b.event_location ?? null,
        budget: b.budget ?? null,
        guests: b.guests ?? null,
        howDidYouHear: b.how_did_you_hear ?? null,
        additionalDetails: b.additional_details ?? null,
        fileUrls: b.file_urls ?? [],
        fileNames: b.file_names ?? [],
        date: b.created_at ?? new Date().toISOString(),
        status: b.status ?? 'New',
        raw: b,
      }));
      setInquiries(mapped);
    } catch (error) {
      console.error('Failed to load bookings:', error);
      setInquiries([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      void refresh();
    }
  }, [isAuthenticated, refresh]);

  const deleteInquiry: InquiriesContextValue['deleteInquiry'] = async (id) => {
    const res = await fetch(`/api/admin/bookings/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || 'Failed to delete booking');
    setInquiries((prev) => prev.filter((i: any) => i.id !== id));
  };

  const updateStatus: InquiriesContextValue['updateStatus'] = async (id, status) => {
    const res = await fetch(`/api/admin/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || 'Failed to update booking');
    setInquiries((prev) =>
      prev.map((i: any) => (i.id === id ? { ...i, status, raw: { ...i.raw, status } } : i))
    );
  };

  const value = useMemo<InquiriesContextValue>(
    () => ({ inquiries, setInquiries, isLoading, refresh, deleteInquiry, updateStatus }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [inquiries, setInquiries, isLoading, refresh]
  );

  return <InquiriesContext.Provider value={value}>{children}</InquiriesContext.Provider>;
}

export function useInquiries() {
  const ctx = useContext(InquiriesContext);
  if (!ctx) throw new Error('useInquiries must be used within InquiriesProvider');
  return ctx;
}
