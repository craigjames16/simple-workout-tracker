'use client';

import MuscleGroupBarChart from '@/components/MuscleGroupBarChart';
import { ResponsiveContainer } from '@/components/ResponsiveContainer';
import { Paper, Typography, Box } from '@mui/material';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [muscleGroups, setMuscleGroups] = useState<any>(null);

  useEffect(() => {
    const fetchMuscleGroups = async () => {
      try {
        const response = await fetch('/api/dashboard?data=muscleGroups');
        const data = await response.json();
        setMuscleGroups(data);
      } catch (error) {
        console.error('Error fetching muscle groups:', error);
      }
    };

    fetchMuscleGroups();
  }, []);

  return (
    <ResponsiveContainer>
      <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Box sx={{ flexGrow: 1, minHeight: 0 }}>
          {muscleGroups ? (
            <MuscleGroupBarChart data={muscleGroups} />
          ) : (
            <Typography variant="h6">Loading...</Typography>
          )}
        </Box>
      </Paper>
    </ResponsiveContainer>
  );
} 