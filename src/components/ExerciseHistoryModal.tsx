import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Grid, Tab, Tabs } from '@mui/material';
import { format } from 'date-fns';
import { useState } from 'react';
import EChartsReact from 'echarts-for-react';
import GradientButton from './GradientButton';

interface ExerciseSet {
  weight: number;
  reps: number;
  setNumber: number;
}

interface HistoryInstance {
  workoutInstanceId: number | string;
  volume: number;
  completedAt: string | Date;
  sets: ExerciseSet[];
}

interface ExerciseHistoryModalProps {
  open: boolean;
  onClose: () => void;
  exerciseName: string;
  history: HistoryInstance[];
}

const ExerciseHistoryChart = ({ history }: { history: HistoryInstance[] }) => {
  const chartData = history.map(instance => ({
    date: new Date(instance.completedAt).toLocaleDateString(),
    volume: instance.volume,
  }));

  const option = {
    tooltip: { 
      trigger: 'axis',
      formatter: (params: any) => {
        const data = params[0];
        return `${data.name}<br/>Volume: ${data.value.toLocaleString()}`;
      }
    },
    grid: { left: 80, right: 30, bottom: 50, top: 30 },
    xAxis: {
      type: 'category',
      data: chartData.map(d => d.date),
      name: 'Date',
      nameLocation: 'center',
      nameGap: 30,
      axisLabel: { fontSize: 14 },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      name: 'Volume',
      nameLocation: 'center',
      nameGap: 50,
      axisLabel: { fontSize: 14 },
      splitLine: { show: false },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    series: [
      {
        data: chartData.map(d => d.volume),
        type: 'line',
        itemStyle: { color: '#8884d8' },
        lineStyle: { width: 3 },
        symbol: 'circle',
        symbolSize: 6,
        smooth: true
      }
    ]
  };

  return (
    <Box sx={{ width: '100%', height: 250 }}>
      <EChartsReact
        style={{ width: '100%', height: 250 }}
        option={option}
      />
    </Box>
  );
};

export default function ExerciseHistoryModal({ open, onClose, exerciseName, history }: ExerciseHistoryModalProps) {
  const [tabValue, setTabValue] = useState(0);

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          width: '95%',
          m: 0,
          '& .MuiDialogTitle-root': {
            py: 1,
            textAlign: 'center'
          },
          '& .MuiDialogContent-root': {
            py: 1,
            px: 1,
          },
          '& .MuiDialogActions-root': {
            py: 1,
          }
        }
      }}
    >
      <DialogTitle>
        {exerciseName} History
      </DialogTitle>
      <DialogContent>
        <Tabs 
          value={tabValue} 
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider', 
            mb: 2,
            '& .MuiTab-root': {
              color: 'rgba(255,255,255,0.7)',
              fontWeight: 600,
              fontSize: '0.9rem',
              '&.Mui-selected': {
                color: 'primary.main',
                fontWeight: 700,
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: 'primary.main',
              height: 3,
            }
          }}
        >
          <Tab label="Sets" />
          <Tab label="Volume" />
        </Tabs>

        {tabValue === 0 ? (
          <>
            {history?.sort((a, b) => 
              new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
            ).map((instance, index) => {
              // Group sets by weight
              const setsByWeight = instance.sets.reduce((acc, set) => {
                if (!acc[set.weight]) {
                  acc[set.weight] = [];
                }
                acc[set.weight].push(set);
                return acc;
              }, {} as Record<number, ExerciseSet[]>);

              return (
                <Box key={index} sx={{ mb: 3, p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'primary.main', mb: 1 }}>
                    {format(new Date(instance.completedAt), 'MMM d, yyyy')}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
                    Total Volume: {instance.volume.toLocaleString()} lbs
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {Object.entries(setsByWeight)
                      .sort(([weightA], [weightB]) => Number(weightB) - Number(weightA)) // Sort by weight descending
                      .map(([weight, sets]) => (
                        <Box 
                          key={weight}
                          sx={{ 
                            px: 2, 
                            py: 1.5, 
                            borderRadius: 1, 
                            bgcolor: 'rgba(59, 130, 246, 0.1)', 
                            border: '1px solid rgba(59, 130, 246, 0.2)',
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)', mb: 0.5 }}>
                            {weight}lbs
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                            {sets.length} set{sets.length > 1 ? 's' : ''}: {sets.map(set => set.reps).join(', ')} reps
                          </Typography>
                        </Box>
                      ))}
                  </Box>
                </Box>
              );
            })}

            {history?.length === 0 && (
              <Typography color="text.secondary">
                No previous history found for this exercise.
              </Typography>
            )}
          </>
        ) : (
          <ExerciseHistoryChart history={history || []} />
        )}
      </DialogContent>
      <DialogActions>
        <GradientButton onClick={onClose}>Close</GradientButton>
      </DialogActions>
    </Dialog>
  );
} 