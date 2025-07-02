import React, { useRef } from 'react';
import { Paper, Box, Typography, IconButton } from '@/components';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { motion } from "framer-motion";
import SetRow from './SetRow';
import { ExerciseTracking } from '@/types/workout-tracking';

interface ExerciseCardProps {
  exercise: ExerciseTracking;
  exerciseIndex: number;
  isWorkoutCompleted: boolean;
  onUpdateSet: (exerciseIndex: number, setIndex: number, field: 'reps' | 'weight', value: number) => void;
  onSetCompletion: (exerciseIndex: number, setIndex: number, completed: boolean) => void;
  onShowHistory: (exercise: ExerciseTracking) => void;
  onExerciseMenuOpen: (event: React.MouseEvent<HTMLElement>, exerciseIndex: number) => void;
  onSetMenuOpen: (event: React.MouseEvent<HTMLButtonElement>, exerciseIndex: number, setIndex: number) => void;
}

export default function ExerciseCard({
  exercise,
  exerciseIndex,
  isWorkoutCompleted,
  onUpdateSet,
  onSetCompletion,
  onShowHistory,
  onExerciseMenuOpen,
  onSetMenuOpen
}: ExerciseCardProps) {
  const setRefs = useRef<{ [key: string]: React.RefObject<HTMLElement> }>({});

  const getSetRef = (exerciseId: number, setIndex: number) => {
    const refKey = `set-${exerciseId}-${setIndex}`;
    if (!setRefs.current[refKey]) {
      setRefs.current[refKey] = { current: null };
    }
    return setRefs.current[refKey];
  };

  const completedSets = (exercise.sets || []).filter(set => set.completed).length;
  const totalSets = (exercise.sets || []).length;

  return (
    <motion.div
      key={exercise.exerciseId}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: exerciseIndex * 0.1 }}
    >
      <Paper 
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 2, // Changed from 4 to 2 (8px)
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
      >
        {/* Exercise Header */}
        <Box sx={{ 
          p: { xs: 2, sm: 3 }, 
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ flex: 1 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700, 
                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                  color: 'white',
                  mb: 0.5
                }}
              >
                {exercise.exerciseName}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  color: 'rgba(156, 163, 175, 0.8)',
                  fontWeight: 500
                }}
              >
                {completedSets} of {totalSets} sets completed
              </Typography>
            </Box>
            
            {/* Last workout info and action buttons */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* Last workout info - shown on larger screens */}
              <Box sx={{ 
                textAlign: 'right',
                display: { xs: 'none', sm: 'block' }
              }}>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'rgba(156, 163, 175, 0.6)',
                    fontSize: '0.6875rem',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    display: 'block'
                  }}
                >
                  Last Volume
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'rgb(34, 197, 94)',
                    fontSize: '0.875rem',
                    fontWeight: 600
                  }}
                >
                  {exercise.mesocycleHistory?.length > 0 
                    ? (() => {
                        const lastWorkout = exercise.mesocycleHistory[exercise.mesocycleHistory.length - 1];
                        const totalVolume = lastWorkout?.sets?.reduce((sum: number, set: any) => 
                          sum + ((set.weight || 0) * (set.reps || 0)), 0) || 0;
                        return `${totalVolume} lbs`;
                      })()
                    : 'No history'
                  }
                </Typography>
              </Box>

              {/* Menu buttons */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton
                  onClick={() => onShowHistory(exercise)}
                  size="small"
                  sx={{ 
                    width: { xs: 32, sm: 40 },
                    height: { xs: 32, sm: 40 },
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 2,
                    color: 'rgba(156, 163, 175, 0.8)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': { 
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                      transform: 'translateY(-1px)'
                    }
                  }}
                >
                  <InfoOutlinedIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                </IconButton>
                <IconButton
                  onClick={(event) => onExerciseMenuOpen(event, exerciseIndex)}
                  disabled={isWorkoutCompleted}
                  size="small"
                  sx={{ 
                    width: { xs: 32, sm: 40 },
                    height: { xs: 32, sm: 40 },
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 2,
                    color: 'rgba(156, 163, 175, 0.8)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': { 
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                      transform: 'translateY(-1px)'
                    }
                  }}
                >
                  <MoreVertIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                </IconButton>
              </Box>
            </Box>
          </Box>
        </Box>

                 {/* Sets Container */}
         <Box sx={{ p: { xs: 2, sm: 3 } }}>
           <Box sx={{ display: 'grid', gap: { xs: 3, sm: 3.5 } }}>
            {Array.isArray(exercise.sets) && exercise.sets.map((set, setIndex) => {
              const isSetCompleted = set.completed || false;

              return (
                <SetRow
                  key={setIndex}
                  ref={getSetRef(exercise.exerciseId, setIndex)}
                  set={set}
                  setIndex={setIndex}
                  exerciseId={exercise.exerciseId}
                  isCompleted={isSetCompleted}
                  isWorkoutCompleted={isWorkoutCompleted}
                  onUpdateSet={(field, value) => onUpdateSet(exerciseIndex, setIndex, field, value)}
                  onMenuOpen={(e) => onSetMenuOpen(e, exerciseIndex, setIndex)}
                  onSetCompletion={(completed) => onSetCompletion(exerciseIndex, setIndex, completed)}
                />
              );
            })}
          </Box>
        </Box>
      </Paper>
    </motion.div>
  );
} 