import React from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@/components';
import { ExerciseCategory } from '@prisma/client';
import GradientButton from '@/components/GradientButton';
import { ExerciseWithCategory } from '@/types/workout-tracking';
import { gradients, glassMorphism, borders, borderRadius } from '@/lib/theme-constants';

interface AddExerciseMenuProps {
  availableExercises: ExerciseWithCategory[];
  selectedCategory: ExerciseCategory | 'ALL';
  selectedExercise: string;
  isWorkoutCompleted: boolean;
  onCategoryChange: (category: ExerciseCategory | 'ALL') => void;
  onExerciseChange: (exerciseId: string) => void;
  onAddExercise: () => void;
  onClose: () => void;
}

export default function AddExerciseMenu({
  availableExercises,
  selectedCategory,
  selectedExercise,
  isWorkoutCompleted,
  onCategoryChange,
  onExerciseChange,
  onAddExercise,
  onClose
}: AddExerciseMenuProps) {
  const handleAddClick = () => {
    onAddExercise();
    onClose();
  };

  return (
    <Box sx={{ 
      p: 3, 
      minWidth: 350,
      background: gradients.secondary,
      border: borders.default,
      borderRadius: borderRadius.large,
      backdropFilter: 'blur(20px)',
    }}>
      <Box sx={{
        p: 2,
        mb: 3,
        background: gradients.primary,
        borderRadius: borderRadius.medium,
        border: borders.default,
      }}>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 600,
            textAlign: 'center',
            color: 'white',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}
        >
          💪 Add Exercise
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            textAlign: 'center', 
            mt: 0.5,
            color: 'rgba(255,255,255,0.9)',
            fontWeight: 500
          }}
        >
          Choose an exercise to add to your workout
        </Typography>
      </Box>
      
      <FormControl fullWidth size="small" sx={{ mb: 3 }}>
        <InputLabel sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>Category</InputLabel>
        <Select
          value={selectedCategory}
          label="Category"
          onChange={(e) => onCategoryChange(e.target.value as ExerciseCategory | 'ALL')}
          sx={{
            background: glassMorphism.light,
            borderRadius: borderRadius.medium,
            '& .MuiOutlinedInput-notchedOutline': {
              border: borders.default,
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255,255,255,0.2)',
            },
          }}
        >
          <MenuItem value="ALL">All Categories</MenuItem>
          {Object.values(ExerciseCategory).map((category) => (
            <MenuItem key={category} value={category}>
              {category.charAt(0) + category.slice(1).toLowerCase()}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth size="small" sx={{ mb: 3 }}>
        <InputLabel sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>Exercise</InputLabel>
        <Select
          value={selectedExercise}
          label="Exercise"
          onChange={(e) => onExerciseChange(e.target.value)}
          sx={{
            background: glassMorphism.light,
            borderRadius: borderRadius.medium,
            '& .MuiOutlinedInput-notchedOutline': {
              border: borders.default,
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255,255,255,0.2)',
            },
          }}
        >
          {availableExercises
            .filter(exercise => selectedCategory === 'ALL' || exercise.category === selectedCategory)
            .map((exercise) => (
              <MenuItem key={exercise.id} value={exercise.id}>
                {exercise.name}
              </MenuItem>
            ))}
        </Select>
      </FormControl>

      <GradientButton
        variant="contained"
        onClick={handleAddClick}
        disabled={!selectedExercise || isWorkoutCompleted}
        fullWidth
        sx={{
          py: 1.5,
          fontSize: '1rem',
          fontWeight: 600,
          borderRadius: borderRadius.medium,
        }}
      >
        Add Exercise
      </GradientButton>
    </Box>
  );
} 