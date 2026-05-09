import type { Metadata, Viewport } from 'next';
import './globals.css';
import { MainLayoutWrapper } from '@/src/components/MainLayoutWrapper';
import { getSiteContentSectionCached } from '@/src/lib/backend-content';
import { headers } from 'next/headers';
import { SonnerGlobalToaster } from '@/components/ui/sonner-global';

export const metadata: Metadata = {
  title: 'Dreamscape Curated Events',
  description:
    'Luxury weddings, private celebrations, and elevated brand experiences thoughtfully designed and beautifully executed.',
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

function normalizeLinkArray(value: unknown) {
  if (!Array.isArray(value)) return undefined;
  const normalized = value
    .map((link) => {
      if (!link || typeof link !== 'object') return null;
      const label = typeof (link as any).label === 'string' ? (link as any).label : '';
      const href = typeof (link as any).href === 'string' ? (link as any).href : '';
      if (!label.trim() || !href.trim()) return null;
      return { label, href };
    })
    .filter(Boolean) as Array<{ label: string; href: string }>;
  return normalized.length ? normalized : undefined;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const pathname =
    requestHeaders.get('x-pathname') ||
    requestHeaders.get('next-url') ||
    '';
  const isAdminRoute = pathname.startsWith('/admin');

  let footerConfig:
    | {
        exploreLinks?: Array<{ label: string; href: string }>;
        companyLinks?: Array<{ label: string; href: string }>;
        connectLinks?: Array<{ label: string; href: string }>;
        copyright?: string;
      }
    | undefined;

  try {
    const { grouped } = await getSiteContentSectionCached('home', 'footer');
    const footer = grouped?.home_footer || {};
    footerConfig = {
      exploreLinks: normalizeLinkArray(footer.exploreLinks?.value),
      companyLinks: normalizeLinkArray(footer.companyLinks?.value),
      connectLinks: normalizeLinkArray(footer.connectLinks?.value),
      copyright: typeof footer.copyright?.value === 'string' ? footer.copyright.value : undefined,
    };
  } catch {
    // keep default footer content
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-brand-light" suppressHydrationWarning>
        <SonnerGlobalToaster />
        <MainLayoutWrapper footerConfig={footerConfig} isAdminRoute={isAdminRoute}>
          {children}
        </MainLayoutWrapper>
      </body>
    </html>
  );
}
