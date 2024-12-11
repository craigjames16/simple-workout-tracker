import { ThemeProvider } from '@mui/material/styles';
import ThemeRegistry from '@/components/ThemeRegistry';
import Navbar from '@/components/Navbar';
import { NextAuthProvider } from './provider';


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

  return (
    <html lang="en">
      <body>
          <NextAuthProvider session={session}>
            <ThemeRegistry>
              <Navbar />
              {children}
            </ThemeRegistry>
          </NextAuthProvider>
      </body>
    </html>
  );
} 