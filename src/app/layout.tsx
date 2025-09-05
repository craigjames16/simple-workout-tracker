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
      }
    ],
    apple: {
      url: '/apple-icon.png',
      sizes: '180x180',
      type: 'image/png',
    },
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
};

export default async function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  if (typeof window === 'undefined') { // Server-side only
    console.log('SNS Initialization');
    try {
      // snsBootstrap.initialize();
    } catch (error) {
      console.error('SNS Initialization Error:', error);
    }
  } else {
    console.log('SNS Initialization skipped on client side');
  }

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:ital,wght@0,100..900;1,100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ErrorBoundary>
          <NextAuthProvider>
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