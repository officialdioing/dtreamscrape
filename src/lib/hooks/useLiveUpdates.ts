'use client';

import { useEffect, useRef, useCallback } from 'react';

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
  const sourceRef = useRef<EventSource | null>(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  const connect = useCallback(() => {
    if (!enabled || typeof window === 'undefined' || typeof EventSource === 'undefined' || !mountedRef.current) {
      return;
    }

    // Close existing connection if any
    if (sourceRef.current) {
      sourceRef.current.close();
    }

    console.log('🔄 Connecting to SSE stream...');
    const source = new EventSource('/api/updates/stream');
    sourceRef.current = source;

    const handleVersion = (event: MessageEvent) => {
      try {
        const parsed = JSON.parse(event.data) as LiveUpdateEvent;
        console.log('✅ SSE event received:', parsed);
        if (mountedRef.current) {
          onUpdateRef.current(parsed);
        }
        // Reset retry count on successful message
        retryCountRef.current = 0;
      } catch (error) {
        console.error('❌ Failed to parse live update event:', error);
      }
    };

    const handleOpen = () => {
      console.log('✅ SSE connection established');
      retryCountRef.current = 0;
    };

    const handleError = (error: Event) => {
      console.error('❌ SSE connection error:', error);
      console.log(`🔄 Retry attempt: ${retryCountRef.current + 1}`);

      // Close the failed connection
      if (sourceRef.current) {
        sourceRef.current.close();
        sourceRef.current = null;
      }

      // Don't reconnect if component is unmounted
      if (!mountedRef.current) {
        return;
      }

      // Exponential backoff with max 30 seconds
      const backoffDelay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
      retryCountRef.current++;

      console.log(`🔄 Reconnecting in ${backoffDelay}ms...`);

      // Clear any existing retry timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }

      // Schedule reconnection
      retryTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          connect();
        }
      }, backoffDelay);
    };

    source.addEventListener('version', handleVersion);
    source.addEventListener('open', handleOpen);
    source.onerror = handleError;

    return () => {
      source.removeEventListener('version', handleVersion);
      source.removeEventListener('open', handleOpen);
      source.removeEventListener('error', handleError);
    };
  }, [enabled]);

  useEffect(() => {
    mountedRef.current = true;

    if (!enabled) return;

    // Initial connection
    const cleanup = connect();

    return () => {
      mountedRef.current = false;
      // Cleanup on unmount
      if (sourceRef.current) {
        sourceRef.current.close();
        sourceRef.current = null;
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      if (cleanup) cleanup();
    };
  }, [enabled, connect]);
}
