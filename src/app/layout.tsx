import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import AppShell from '@/components/shell/AppShell';
import './globals.css';

export const metadata: Metadata = {
  title: 'Wardley Canvas',
  description: 'Create, analyze, and learn with interactive Wardley Maps.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Section 4.3 fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;550;600;650;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <AppShell>
          {children}
        </AppShell>
        <Toaster />
      </body>
    </html>
  );
}
