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
      // background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
      // border: '1px solid rgba(255, 255, 255, 0.1)',
      // borderRadius: borderRadius.medium,
      // overflow: 'hidden',
      // backdropFilter: 'blur(20px)',
      // boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    }}>
      {/* Header removed as per new compact design */}
      
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