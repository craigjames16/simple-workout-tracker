'use client';

import { useState } from 'react';
import { Box, Typography, Grid, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ExerciseCard } from './ExerciseCard';

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

interface ExerciseDataTabProps {
  exerciseStats: ExerciseStats | null;
}

export function ExerciseDataTab({ exerciseStats }: ExerciseDataTabProps) {
  const [expandedExercise, setExpandedExercise] = useState<number | false>(false);

  const handleAccordionChange = (exerciseId: number) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedExercise(isExpanded ? exerciseId : false);
  };

  // Get remaining exercises (all exercises except the top 3)
  const remainingExercises = exerciseStats 
    ? exerciseStats.allExercises.filter(
        exercise => !exerciseStats.topExercises.some(top => top.id === exercise.id)
      )
    : [];

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      {exerciseStats ? (
        <Box>
          {/* Top 3 Exercises Section */}
          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 700,
                color: 'white',
                fontSize: { xs: '1.25rem', sm: '1.5rem' },
                mb: 3
              }}
            >
              Top Exercises
            </Typography>
            <Grid container spacing={3}>
              {exerciseStats.topExercises.map((exercise) => (
                <Grid item xs={12} sm={6} md={4} key={exercise.id}>
                  <ExerciseCard exercise={exercise} />
                </Grid>
              ))}
            </Grid>
          </Box>
          
          {/* Remaining Exercises List */}
          {remainingExercises.length > 0 && (
            <Box>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 700,
                  color: 'white',
                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                  mb: 3
                }}
              >
                All Exercises
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {remainingExercises.map((exercise) => (
                  <Accordion
                    key={exercise.id}
                    expanded={expandedExercise === exercise.id}
                    onChange={handleAccordionChange(exercise.id)}
                    sx={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px !important',
                      boxShadow: 'none',
                      '&:before': {
                        display: 'none'
                      },
                      '&.Mui-expanded': {
                        margin: '0 !important'
                      }
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}
                      sx={{
                        color: 'white',
                        '&:hover': {
                          bgcolor: 'rgba(255, 255, 255, 0.05)'
                        },
                        '& .MuiAccordionSummary-content': {
                          alignItems: 'center',
                          my: 1
                        }
                      }}
                    >
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {exercise.name}
                      </Typography>
                      <Box sx={{ ml: 'auto', mr: 2, display: 'flex', gap: 2 }}>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          {exercise.totalSets} sets
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          {Math.round(exercise.totalVolume).toLocaleString()} volume
                        </Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 2, pb: 2 }}>
                      <ExerciseCard exercise={exercise} />
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      ) : (
        <Typography 
          variant="h6" 
          sx={{ 
            color: 'rgba(255, 255, 255, 0.7)',
            textAlign: 'center',
            py: 4
          }}
        >
          No exercise data available
        </Typography>
      )}
    </Box>
  );
}

