'use client';

import { useState, useRef } from 'react';
import {
  Typography,
  Box,
  Tabs,
  Tab,
  Button,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { ResponsiveContainer } from '@/components/ResponsiveContainer';
import { useRouter } from 'next/navigation';
import { PlansTab, ExercisesTab, MesocyclesTab, type ExercisesTabRef, type MesocyclesTabRef } from '@/components/plan';

type TabValue = 'plans' | 'exercises' | 'mesocycles';

export default function PlanPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabValue>('plans');
  const exercisesTabRef = useRef<ExercisesTabRef>(null);
  const mesocyclesTabRef = useRef<MesocyclesTabRef>(null);

  // Get button action based on active tab
  const getButtonAction = () => {
    switch (activeTab) {
      case 'plans':
        return () => router.push('/plans/create');
      case 'exercises':
        return () => exercisesTabRef.current?.openCreateDialog();
      case 'mesocycles':
        return () => mesocyclesTabRef.current?.openCreateDialog();
      default:
        return () => {};
    }
  };

  // Get button label based on active tab
  const getButtonLabel = () => {
    switch (activeTab) {
      case 'plans':
        return 'New Plan';
      case 'exercises':
        return 'New Exercise';
      case 'mesocycles':
        return 'New Mesocycle';
      default:
        return 'New';
    }
  };

  return (
    <ResponsiveContainer maxWidth="md">
      <Box sx={{
        height: '100%', 
        display: 'flex',
        flexDirection: 'column',
        px: { xs: 2, sm: 3 },
        pt: { xs: 2, sm: 2, md: 2 },
      }}>
        <Box sx={{
          pb: { xs: 2, sm: 3 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Typography variant="h4"
            sx={{ 
              fontWeight: 700,
              color: 'white',
              fontSize: { xs: '1.5rem', sm: '2rem' }
            }}>
            Plan
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={getButtonAction()}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            {getButtonLabel()}
          </Button>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue as TabValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Plans" value="plans" />
            <Tab label="Exercises" value="exercises" />
            <Tab label="Mesocycles" value="mesocycles" />
          </Tabs>
        </Box>

        {/* Plans Tab */}
        {activeTab === 'plans' && <PlansTab />}

        {/* Exercises Tab */}
        {activeTab === 'exercises' && <ExercisesTab ref={exercisesTabRef} />}

        {/* Mesocycles Tab */}
        {activeTab === 'mesocycles' && <MesocyclesTab ref={mesocyclesTabRef} />}
      </Box>
    </ResponsiveContainer>
  );
}
