'use client';

import { Box, Typography, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { gradients, themeColors } from '@/lib/theme-constants';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ExerciseCategory } from '@prisma/client';

interface Exercise {
  id: number;
  name: string;
  category: ExerciseCategory;
}

interface SortableExerciseProps {
  id: string;
  exercise: Exercise;
  dayId: string;
  order: number;
  onRemove: (dayId: string, exerciseId: number) => void;
}

export function SortableExercise({ id, exercise, dayId, order, onRemove }: SortableExerciseProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  } as const;

  return (
    <Box
      ref={setNodeRef}
      {...attributes}
      sx={{
        p: 1.5,
        mb: 1,
        bgcolor: isDragging ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
        borderRadius: 1,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        transition: 'all 0.2s ease',
        '&:hover': {
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }
      }}
      style={style}
    >
      <Box 
        {...listeners}
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1.5,
          flex: 1,
          cursor: 'grab',
          '&:active': {
            cursor: 'grabbing'
          }
        }}
      >
        <Box
          sx={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: gradients.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Typography 
            sx={{ 
              color: 'white', 
              fontSize: '0.75rem',
              fontWeight: 700,
              lineHeight: 1
            }}
          >
            {order}
          </Typography>
        </Box>
        <Typography sx={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.875rem' }}>
          {exercise.name}
        </Typography>
      </Box>
      <IconButton
        size="small"
        onClick={(e) => {
          console.log('Removing exercise', exercise.id);
          e.stopPropagation();
          
          onRemove(dayId, exercise.id);
        }}
        sx={{ 
          color: 'rgba(239, 68, 68, 0.7)',
          '&:hover': {
            color: 'rgba(239, 68, 68, 0.9)',
            background: 'rgba(239, 68, 68, 0.1)'
          }
        }}
      >
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}
