import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ClerkProviderWrapper } from '@/components/layout/clerk-provider-wrapper';
import QueryProvider from '@/components/layout/query-provider';
import { AppLayoutWrapper } from '@/components/layout/app-layout-wrapper';

export const metadata: Metadata = {
  title: 'Aura AI — AI That Understands You',
  description: 'A premium AI-powered learning, research, and productivity platform that adapts to your workflow.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const dynamic = 'force-dynamic';


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="h-full min-h-screen text-foreground bg-background antialiased" suppressHydrationWarning>
        <ClerkProviderWrapper>
          <QueryProvider>
            <AppLayoutWrapper>
              {children}
            </AppLayoutWrapper>
          </QueryProvider>
        </ClerkProviderWrapper>
      </body>
    </html>
  );
}
