'use client';

import { Box } from '@mui/material';
import MesocycleProgress from '@/components/MesocycleProgress';

export function MesocycleDataTab() {
  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      <MesocycleProgress />
    </Box>
  );
}

