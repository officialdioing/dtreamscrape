'use client';

import { useEffect, useRef } from 'react';

type LiveUpdateEvent = {
  version: number;
  type: string;
  timestamp: string;
  resource?: string;
  action?: string;
};

type UseLiveUpdatesOptions = {
  enabled?: boolean;
  onUpdate: (event: LiveUpdateEvent) => void;
};

export function useLiveUpdates({ enabled = true, onUpdate }: UseLiveUpdatesOptions) {
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || typeof EventSource === 'undefined') {
      return;
    }

    const source = new EventSource('/api/updates/stream');

    const handleVersion = (event: MessageEvent) => {
      try {
        const parsed = JSON.parse(event.data) as LiveUpdateEvent;
        onUpdateRef.current(parsed);
      } catch (error) {
        console.error('Failed to parse live update event:', error);
      }
    };

    source.addEventListener('version', handleVersion);

    source.onerror = () => {
      // Let the browser reconnect automatically.
    };

    return () => {
      source.removeEventListener('version', handleVersion);
      source.close();
    };
  }, [enabled]);
}
