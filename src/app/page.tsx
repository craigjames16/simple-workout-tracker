import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  
  // If user is logged in, redirect to dashboard
  if (session) {
    redirect('/dashboard');
  }
  
  // If user is not logged in, redirect to sign-in page
  redirect('/signin');
} 