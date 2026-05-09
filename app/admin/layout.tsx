import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { AdminThemeCleanup } from '@/src/admin/components/AdminThemeCleanup';
import { Providers } from '@/src/admin/providers/Providers';
import { Inter, Playfair_Display } from 'next/font/google';

const adminBodyFont = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-admin-body',
});

const adminHeadingFont = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-admin-heading',
});

export const metadata: Metadata = {
  title: 'CMS Admin Portal',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${adminBodyFont.variable} ${adminHeadingFont.variable} bg-background text-foreground`}
      suppressHydrationWarning
    >
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AdminThemeCleanup />
        <Providers>{children}</Providers>
      </ThemeProvider>
    </div>
  );
}
