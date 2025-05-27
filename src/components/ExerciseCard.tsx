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

  return (
    <motion.div
      key={exercise.exerciseId}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: exerciseIndex * 0.1 }}
    >
      <Paper 
        elevation={2}
        sx={{
          mb: 3,
          borderRadius: 3,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        {/* Exercise Header */}
        <Box sx={{ 
          p: { xs: 1.5, sm: 2 }, 
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(156, 39, 176, 0.3) 100%)'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                {exercise.exerciseName}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                {(exercise.sets || []).filter(set => set.completed).length} of {(exercise.sets || []).length} sets completed
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton
                onClick={() => onShowHistory(exercise)}
                size="small"
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.1)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                }}
              >
                <InfoOutlinedIcon />
              </IconButton>
              <IconButton
                onClick={(event) => onExerciseMenuOpen(event, exerciseIndex)}
                disabled={isWorkoutCompleted}
                size="small"
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.1)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                }}
              >
                <MoreVertIcon />
              </IconButton>
            </Box>
          </Box>
        </Box>

        {/* Sets */}
        <Box sx={{ p: { xs: 1, sm: 2 } }}>
          <Box sx={{ display: 'grid', gap: { xs: 1.5, sm: 2 } }}>
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