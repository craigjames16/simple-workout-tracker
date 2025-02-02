import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Grid, Tab, Tabs } from '@mui/material';
import { format } from 'date-fns';
import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer as RechartsContainer } from 'recharts';

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

  return (
    <Box sx={{ width: '100%', height: 250 }}>
      <RechartsContainer>
        <LineChart 
          data={chartData}
          margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
        >
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false}
            tick={{ fill: 'transparent' }}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
          />
          <Tooltip />
          <Line 
            type="monotone" 
            dataKey="volume" 
            stroke="#8884d8" 
            dot={false} 
          />
        </LineChart>
      </RechartsContainer>
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
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
        >
          <Tab label="Sets" />
          <Tab label="Volume" />
        </Tabs>

        {tabValue === 0 ? (
          <>
            {history?.sort((a, b) => 
              new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
            ).map((instance, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  {format(new Date(instance.completedAt), 'MMM d, yyyy')}
                </Typography>
                <Grid container spacing={2} sx={{ pl: 2 }}>
                  {instance.sets
                    .sort((a, b) => a.setNumber - b.setNumber)
                    .map((set, setIndex) => (
                      <Grid item xs={12} key={setIndex}>
                        <Typography variant="body2">
                          Set {set.setNumber}: {set.weight}lbs × {set.reps} reps
                        </Typography>
                      </Grid>
                    ))}
                </Grid>
              </Box>
            ))}

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
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
} 