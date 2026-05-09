'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/src/admin/components/Layout';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/src/admin/providers/GolangAuthProvider';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading, logout } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only redirect if we're not loading and user is not authenticated
    if (!isLoading && !isAuthenticated) {
      router.replace('/admin/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Ensure SSR + first client render match to avoid hydration flicker/mismatch.
  if (!mounted || isLoading) {
    return (
      <div
        className="grid min-h-screen place-items-center bg-background p-4 text-foreground dark:bg-[radial-gradient(circle_at_20%_10%,rgba(209,122,163,0.16)_0%,rgba(209,122,163,0)_45%),radial-gradient(circle_at_85%_30%,rgba(201,168,76,0.12)_0%,rgba(201,168,76,0)_45%),linear-gradient(180deg,#17131d_0%,#211826_100%)]"
        suppressHydrationWarning
      >
        <div
          className="flex items-center gap-3 rounded-full border border-border/70 bg-card px-5 py-3 text-card-foreground shadow-[0_18px_54px_rgba(64,21,63,0.06)]"
          suppressHydrationWarning
        >
          <Spinner className="size-5 text-primary" suppressHydrationWarning />
          <div className="text-sm font-medium text-muted-foreground" suppressHydrationWarning>
            Loading admin…
          </div>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) return null;

  return (
    <div suppressHydrationWarning>
      <Layout onLogout={logout}>{children}</Layout>
    </div>
  );
}
