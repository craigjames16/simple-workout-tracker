import { Container, Typography, Paper, Button, Box } from '@mui/material';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  
  // If user is logged in, redirect to dashboard
  if (session) {
    redirect('/dashboard');
  }

  const commitHash = process.env.NEXT_PUBLIC_COMMIT_HASH;
  console.log({commitHash});
  
  return (
    <Container maxWidth="sm">
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome to Workout Tracker
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Create, schedule, and track your workouts all in one place.
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button 
            component={Link} 
            href="/auth/signin" 
            variant="contained" 
            size="large"
            sx={{ flex: 1 }}
          >
            Sign In
          </Button>
        </Box>
        
        <Typography variant="caption" display="block" gutterBottom>
          Build Commit: {commitHash}
        </Typography>
      </Paper>
    </Container>
  );
} 