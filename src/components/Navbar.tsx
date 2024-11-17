'use client';

import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import Link from 'next/link';

export default function Navbar() {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>
            Workout Tracker
          </Link>
        </Typography>
        <Box>
          <Button color="inherit" component={Link} href="/plans">
            Plans
          </Button>
          <Button color="inherit" component={Link} href="/track">
            Track Workout
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
} 