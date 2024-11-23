'use client';

import { AppBar, Toolbar, Button } from '@mui/material';
import Link from 'next/link';

export default function Navbar() {
  return (
    <AppBar position="static">
      <Toolbar>
        <Button color="inherit" component={Link} href="/">
          Home
        </Button>
        <Button color="inherit" component={Link} href="/exercises">
          Exercises
        </Button>
        <Button color="inherit" component={Link} href="/workouts">
          Workouts
        </Button>
        <Button color="inherit" component={Link} href="/plans">
          Plans
        </Button>
        <Button color="inherit" component={Link} href="/mesocycles">
          Mesocycles
        </Button>
      </Toolbar>
    </AppBar>
  );
} 