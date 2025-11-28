'use client';

import { ResponsiveContainer } from '@/components/ResponsiveContainer';
import { 
  Typography, Box, Tabs, Tab, CircularProgress, useTheme, useMediaQuery
} from '@mui/material';
import { useEffect, useState } from 'react';
import { gradients, borders } from '@/lib/theme-constants';
import { TabPanel, a11yProps } from '@/components/dashboard/TabPanel';
import { VolumeDataTab } from '@/components/dashboard/VolumeDataTab';
import { SetDataTab } from '@/components/dashboard/SetDataTab';
import { MesocycleDataTab } from '@/components/dashboard/MesocycleDataTab';
import { ExerciseDataTab } from '@/components/dashboard/ExerciseDataTab';

interface ExercisePRs {
  maxWeight: number;
  maxReps: number;
  maxVolume: number;
}

interface ExerciseVolumePoint {
  workoutInstanceId: number;
  date: string;
  volume: number;
  sets: number;
}

interface ExerciseStat {
  id: number;
  name: string;
  category: string;
  totalSets: number;
  totalVolume: number;
  prs: ExercisePRs;
  lastPerformed: string | null;
  volumeProgression: ExerciseVolumePoint[];
}

interface ExerciseStats {
  topExercises: ExerciseStat[];
  allExercises: ExerciseStat[];
}

export default function DashboardPage() {
  const [tabValue, setTabValue] = useState(0);
  const [volumeData, setVolumeData] = useState<Record<string, any[]> | null>(null);
  const [setData, setSetData] = useState<Record<string, any[]> | null>(null);
  const [exerciseStats, setExerciseStats] = useState<ExerciseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Fetch muscle group metrics for volume and set counts
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const [volumeRes, setRes, exerciseStatsRes] = await Promise.all([
          fetch('/api/dashboard?data=muscleGroupVolume'), // combine this endpoint and the one below. Display both on the same graph/tab
          fetch('/api/dashboard?data=muscleGroupSets'),
          fetch('/api/dashboard?data=exerciseStats')
        ]);

        if (!volumeRes.ok) throw new Error('Failed to fetch muscle group volume data');
        if (!setRes.ok) throw new Error('Failed to fetch muscle group set data');
        if (!exerciseStatsRes.ok) throw new Error('Failed to fetch exercise stats data');

        const [volumeJson, setJson, exerciseStatsJson] = await Promise.all([
          volumeRes.json(), 
          setRes.json(),
          exerciseStatsRes.json()
        ]);
        setVolumeData(volumeJson);
        setSetData(setJson);
        setExerciseStats(exerciseStatsJson);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <ResponsiveContainer maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </ResponsiveContainer>
    );
  }

  if (error) {
    return (
      <ResponsiveContainer>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <Typography color="error">{error}</Typography>
        </Box>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer maxWidth="md">
      <Box sx={{
        height: '100%', 
        display: 'flex',
        flexDirection: 'column',
        px: { xs: 2, sm: 3 },
        pt: { xs: 6, sm: 6, md: 6 },
      }}>
        <Box sx={{
          pb: { xs: 2, sm: 3 },
        }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700,
              color: 'white',
              fontSize: { xs: '1.5rem', sm: '2rem' }
            }}
          >
            Data
          </Typography>
        </Box>

        <Box sx={{ 
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          mb: 2
        }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="dashboard tabs"
            variant={isMobile ? "fullWidth" : "standard"}
            sx={{
              '& .MuiTabs-root': {
                minHeight: 40,
              },
              '& .MuiTab-root': {
                minWidth: 'auto',
                px: 3,
                py: 1.5,
                borderRadius: 1,
                color: 'rgba(156, 163, 175, 0.9)',
                fontWeight: 500,
                fontSize: '0.875rem',
                textTransform: 'none',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.04)',
                  color: 'rgba(255, 255, 255, 0.9)',
                  transform: 'translateY(-1px)'
                },
                '&.Mui-selected': {
                  background: gradients.glass,
                  color: 'white',
                  fontWeight: 600,
                  border: borders.default,
                  boxShadow: '0 4px 12px -4px rgba(0, 0, 0, 0.1)'
                }
              },
              '& .MuiTabs-indicator': {
                display: 'none'
              }
            }}
          >
            <Tab label="Volume" {...a11yProps(0)} />
            <Tab label="Sets" {...a11yProps(1)} />
            <Tab label="Mesocycles" {...a11yProps(2)} />
            <Tab label="Exercises" {...a11yProps(3)} />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <VolumeDataTab volumeData={volumeData} />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <SetDataTab setData={setData} />
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <MesocycleDataTab />
        </TabPanel>
        
        <TabPanel value={tabValue} index={3}>
          <ExerciseDataTab exerciseStats={exerciseStats} />
        </TabPanel>
      </Box>
    </ResponsiveContainer>
  );
}
