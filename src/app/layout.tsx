import ThemeRegistry from '@/components/ThemeRegistry';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'Workout Tracker',
  description: 'Track and schedule your workouts',
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>
          <Navbar />
          {children}
        </ThemeRegistry>
      </body>
    </html>
  );
} 