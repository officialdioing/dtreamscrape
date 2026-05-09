'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Navigation } from './Navigation';
import { Footer } from './Footer';

export function MainLayoutWrapper({
  children,
  footerConfig,
  isAdminRoute,
}: {
  children: React.ReactNode;
  footerConfig?: {
    exploreLinks?: Array<{ label: string; href: string }>;
    companyLinks?: Array<{ label: string; href: string }>;
    connectLinks?: Array<{ label: string; href: string }>;
    copyright?: string;
  };
  isAdminRoute?: boolean;
}) {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(Boolean(isAdminRoute));
  const [isNotFoundRoute, setIsNotFoundRoute] = useState(false);

  useEffect(() => {
    setIsAdmin(pathname.startsWith('/admin'));
  }, [pathname]);

  useEffect(() => {
    setIsNotFoundRoute(document.body.classList.contains('not-found-route'));
  }, [pathname]);

  // Remove browser extension attributes that cause hydration mismatches
  useEffect(() => {
    const removeExtensionAttributes = () => {
      document.querySelectorAll('[bis_skin_checked]').forEach(el => {
        el.removeAttribute('bis_skin_checked');
      });
    };

    // Run immediately and periodically to catch dynamically added attributes
    removeExtensionAttributes();
    const interval = setInterval(removeExtensionAttributes, 500);

    // Also run on DOM mutations
    const observer = new MutationObserver(() => {
      removeExtensionAttributes();
    });

    observer.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ['bis_skin_checked']
    });

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      {!isAdmin && !isNotFoundRoute && <Navigation />}
      {children}
      {!isAdmin && !isNotFoundRoute && <Footer config={footerConfig} />}
    </>
  );
}
