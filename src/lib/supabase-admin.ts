import 'server-only';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SECRET_KEY || '';
const supabaseFetchTimeoutMs = Number(process.env.SUPABASE_FETCH_TIMEOUT_MS || 15000);

function createTimeoutFetch(timeoutMs: number) {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      // If a signal was provided by the caller, honor it (don’t override).
      // Supabase does not generally pass one, so the timeout signal is used.
      const signal = init?.signal ?? controller.signal;
      return await fetch(input as any, { ...(init || {}), signal });
    } finally {
      clearTimeout(timeoutId);
    }
  };
}

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set in environment variables');
}
if (!supabaseServiceRoleKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_SECRET_KEY is not set in environment variables');
}

let adminClient: ReturnType<typeof createClient> | null = null;

export function supabaseAdmin() {
  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  }
  if (!supabaseServiceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  }
  if (!adminClient) {
    adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      // @ts-ignore - Supabase type issue with db schema option
      db: { schema: 'public' },
      global: {
        fetch: createTimeoutFetch(
          Number.isFinite(supabaseFetchTimeoutMs) && supabaseFetchTimeoutMs > 0
            ? supabaseFetchTimeoutMs
            : 15000
        ),
      }
    });
  }
  return adminClient;
}
