import { Container, Typography, Paper } from '@mui/material';

export default function HomePage() {
  return (
    <Container maxWidth="sm">
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome to Workout Tracker
        </Typography>
        <Typography variant="body1">
          Create, schedule, and track your workouts all in one place.
        </Typography>
      </Paper>
    </Container>
  );
} 