import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { AdminThemeCleanup } from '@/src/admin/components/AdminThemeCleanup';
import { Providers } from '@/src/admin/providers/Providers';
// Using local font fallbacks to avoid build-time Google Fonts download issues
const adminBodyFont = {
  variable: '--font-admin-body',
};

const adminHeadingFont = {
  variable: '--font-admin-heading',
};

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
