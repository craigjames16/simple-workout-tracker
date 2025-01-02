import { ThemeProvider } from '@mui/material/styles';
import ThemeRegistry from '@/components/ThemeRegistry';
import Navbar from '@/components/Navbar';
import { NextAuthProvider } from './provider';
import ErrorBoundary from '@/components/ErrorBoundary';
import { snsBootstrap } from '@/lib/sns-boot';

export const metadata = {
  title: 'Workout Tracker',
  description: 'Track and schedule your workouts',
  manifest: '/manifest.json',
  themeColor: '#000000',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Workout Tracker',
  },
  icons: {
    icon: [
      {
        url: '/favicon.ico',
        sizes: 'any',
      },
      {
        url: '/icon.png',
        type: 'image/png',
        sizes: '192x192',
      },
    ],
    apple: {
      url: '/apple-icon.png',
      sizes: '180x180',
      type: 'image/png',
    },
  },
};

export default async function RootLayout({
  children,
  session
}: {
  children: React.ReactNode,
  session: any
}) {
  if (typeof window === 'undefined') { // Server-side only
    console.log('SNS Initialization');
    try {
      snsBootstrap.initialize();
    } catch (error) {
      console.error('SNS Initialization Error:', error);
    }
  } else {
    console.log('SNS Initialization skipped on client side');
  }

  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <NextAuthProvider session={session}>
            <ThemeRegistry>
              <Navbar />
              {children}
            </ThemeRegistry>
          </NextAuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
} 