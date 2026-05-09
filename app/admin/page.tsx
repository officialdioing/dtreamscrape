'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/admin/providers/GolangAuthProvider';
import { Spinner } from '@/components/ui/spinner';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Only redirect after loading is complete
    if (!isLoading) {
      if (isAuthenticated) {
        // Use replace to avoid back button issues
        router.replace('/admin/dashboard');
      } else {
        router.replace('/admin/login');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_20%_10%,rgba(64,21,63,0.16)_0%,rgba(64,21,63,0)_45%),radial-gradient(circle_at_85%_30%,rgba(201,168,76,0.14)_0%,rgba(201,168,76,0)_45%),linear-gradient(180deg,#F7FAFC_0%,#FFFFFF_100%)] p-4">
        <div className="flex items-center gap-3 rounded-full border border-border/70 bg-card px-5 py-3 text-card-foreground shadow-[0_18px_54px_rgba(64,21,63,0.06)]">
          <Spinner className="size-5 text-primary" />
          <div className="text-sm font-medium text-gray-700">Loading admin…</div>
        </div>
      </div>
    );
  }

  return null;
}
