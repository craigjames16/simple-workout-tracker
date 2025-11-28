'use client';

import { useState, useRef } from 'react';
import {
  Typography,
  Box,
  Tabs,
  Tab,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FloatingActionButton from '@/components/FloatingActionButton';
import { ResponsiveContainer } from '@/components/ResponsiveContainer';
import { useRouter } from 'next/navigation';
import { PlansTab, ExercisesTab, MesocyclesTab, type ExercisesTabRef, type MesocyclesTabRef } from '@/components/plan';

type TabValue = 'plans' | 'exercises' | 'mesocycles';

export default function PlanPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabValue>('plans');
  const exercisesTabRef = useRef<ExercisesTabRef>(null);
  const mesocyclesTabRef = useRef<MesocyclesTabRef>(null);

  // Get FAB action based on active tab
  const getFABAction = () => {
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
          <Typography variant="h4"
            sx={{ 
              fontWeight: 700,
              color: 'white',
              fontSize: { xs: '1.5rem', sm: '2rem' }
            }}>
            Plan
          </Typography>
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

        <FloatingActionButton
          icon={<AddIcon />}
          onClick={getFABAction()}
        />
      </Box>
    </ResponsiveContainer>
  );
}
