import ThemeRegistry from '@/components/ThemeRegistry';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'Workout Tracker',
  description: 'Track and schedule your workouts',
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