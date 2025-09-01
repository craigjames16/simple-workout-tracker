'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import HotelIcon from '@mui/icons-material/Hotel';
import { ExerciseCategory } from '@prisma/client';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import GradientButton from './GradientButton';
import { SortableExercise } from '.';
import { gradients, themeColors, textStyles, borders, shadows } from '@/lib/theme-constants';

interface Exercise {
  id: number;
  name: string;
  category: ExerciseCategory;
}

interface WorkoutDay {
  id: string;
  name: string;
  isRestDay: boolean;
  workoutExercises: Exercise[];
  dayNumber: number;
}

interface WorkoutDayCardProps {
  day: WorkoutDay;
  dayIndex: number;
  availableExercises: Exercise[];
  selectedCategories: Record<string, string>;
  selectedExercises: Record<string, string>;
  onRemoveDay: (dayId: string) => void;
  onToggleRestDay: (dayId: string) => void;
  onRemoveExercise: (dayId: string, exerciseId: number) => void;
  onAddExercise: (dayId: string) => void;
  onCategoryChange: (dayId: string, category: string) => void;
  onExerciseSelect: (dayId: string, exerciseId: string) => void;
  onCreateExercise: (dayIndex: number) => void;
}

export default function WorkoutDayCard({
  day,
  dayIndex,
  availableExercises,
  selectedCategories,
  selectedExercises,
  onRemoveDay,
  onToggleRestDay,
  onRemoveExercise,
  onAddExercise,
  onCategoryChange,
  onExerciseSelect,
  onCreateExercise,
}: WorkoutDayCardProps) {
  const [openNewExerciseDialog, setOpenNewExerciseDialog] = useState(false);
  const [newExercise, setNewExercise] = useState({
    name: '',
    category: '' as ExerciseCategory
  });

  const groupedExercises = availableExercises.reduce((acc: Record<string, Exercise[]>, exercise) => {
    const category = exercise.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(exercise);
    return acc;
  }, {});

  const filteredExercises = (dayId: string) => {
    const category = selectedCategories[dayId] || 'ALL';
    return category === 'ALL' 
      ? availableExercises 
      : groupedExercises[category] || [];
  };

  const handleOpenNewExerciseDialog = () => {
    setOpenNewExerciseDialog(true);
  };

  const handleCloseNewExerciseDialog = () => {
    setOpenNewExerciseDialog(false);
    setNewExercise({ name: '', category: '' as ExerciseCategory });
  };

  const handleCreateAndAddExercise = async () => {
    try {
      const response = await fetch('/api/exercises', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newExercise),
      });

      if (!response.ok) {
        throw new Error('Failed to create exercise');
      }

      const createdExercise = await response.json();
      
      // Add the new exercise to the current day
      if (!day.isRestDay) {
        // This would need to be handled by the parent component
        // For now, we'll just close the dialog
        handleCloseNewExerciseDialog();
      }
    } catch (err) {
      console.error('Failed to create exercise:', err);
    }
  };

  return (
    <Box sx={{
      borderRadius: 2,
      overflow: 'hidden',
      background: gradients.surface,
      backdropFilter: 'blur(20px)',
      border: borders.default,
      boxShadow: shadows.floating,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 35px 60px -12px rgba(0, 0, 0, 0.35)',
        border: borders.thick,
      }
    }}>
      <Box sx={{
        p: { xs: 2, sm: 3 },
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {day.isRestDay ? (
              <HotelIcon sx={{ 
                mr: 1, 
                color: themeColors.text.secondary,
                fontSize: '1.25rem'
              }} />
            ) : (
              <FitnessCenterIcon sx={{ 
                mr: 1, 
                color: themeColors.primary.main,
                fontSize: '1.25rem'
              }} />
            )}
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 700,
                color: 'white',
                fontSize: { xs: '1rem', sm: '1.125rem' }
              }}
            >
              {day.name}
            </Typography>
          </Box>
          <IconButton 
            onClick={() => onRemoveDay(day.id)}
            sx={{ 
              color: themeColors.accent.error,
              '&:hover': {
                color: 'rgba(239, 68, 68, 0.9)',
                background: 'rgba(239, 68, 68, 0.1)'
              }
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Box>

        <FormControlLabel
          control={
            <Switch
              checked={day.isRestDay}
              onChange={() => onToggleRestDay(day.id)}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: themeColors.text.secondary,
                  '&:hover': {
                    backgroundColor: 'rgba(156, 163, 175, 0.08)',
                  },
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: 'rgba(156, 163, 175, 0.5)',
                },
              }}
            />
          }
          label={
            <Typography sx={{ color: themeColors.text.primary, fontSize: '0.875rem' }}>
              Rest Day
            </Typography>
          }
          sx={{ mb: 2 }}
        />

        {!day.isRestDay && (
          <Box sx={{ mb: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Category</InputLabel>
              <Select
                value={selectedCategories[day.id] || 'ALL'}
                label="Category"
                onChange={(e) => onCategoryChange(day.id, e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 2,
                    color: 'white',
                    '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&.Mui-focused': {
                      borderColor: 'rgba(59, 130, 246, 0.5)',
                      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                    },
                    '& fieldset': {
                      border: 'none'
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                    '&.Mui-focused': {
                      color: 'rgba(59, 130, 246, 0.8)'
                    }
                  },
                  '& .MuiSelect-icon': {
                    color: 'rgba(255, 255, 255, 0.7)'
                  }
                }}
              >
                <MenuItem value="ALL" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>All Categories</MenuItem>
                {Object.values(ExerciseCategory).map((category) => (
                  <MenuItem key={category} value={category} sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    {category.charAt(0) + category.slice(1).toLowerCase()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Exercise</InputLabel>
              <Select
                value={selectedExercises[day.id] || ''}
                label="Exercise"
                onChange={(e) => onExerciseSelect(day.id, e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 2,
                    color: 'white',
                    '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&.Mui-focused': {
                      borderColor: 'rgba(59, 130, 246, 0.5)',
                      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                    },
                    '& fieldset': {
                      border: 'none'
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                    '&.Mui-focused': {
                      color: 'rgba(59, 130, 246, 0.8)'
                    }
                  },
                  '& .MuiSelect-icon': {
                    color: 'rgba(255, 255, 255, 0.7)'
                  }
                }}
              >
                {filteredExercises(day.id)
                  .map((exercise) => (
                    <MenuItem key={exercise.id} value={exercise.id} sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      {exercise.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                onClick={() => onAddExercise(day.id)}
                disabled={!selectedExercises[day.id]}
                sx={{ 
                  flex: 1,
                  background: gradients.primary,
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  color: 'white',
                  '&:hover': {
                    background: gradients.primaryHover,
                    transform: 'translateY(-1px)',
                    boxShadow: '0 8px 25px -8px rgba(59, 130, 246, 0.3)'
                  },
                  '&:disabled': {
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.3)'
                  }
                }}
              >
                Add
              </Button>
              <Button
                variant="outlined"
                onClick={handleOpenNewExerciseDialog}
                startIcon={<AddIcon />}
                sx={{
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  '&:hover': {
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    background: 'rgba(255, 255, 255, 0.05)'
                  }
                }}
              >
                Create New
              </Button>
            </Box>
          </Box>
        )}
        
        {day.isRestDay ? (
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.6)',
              textAlign: 'center',
              fontStyle: 'italic'
            }}
          >
            Rest Day - No exercises
          </Typography>
        ) : (
          <SortableContext
            items={day.workoutExercises.map((ex) => `exercise-${ex.id}-${day.id}`)}
            strategy={verticalListSortingStrategy}
          >
            <Box
              sx={{ 
                minHeight: 100,
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                transition: 'background-color 0.2s ease',
                borderRadius: 1,
                padding: 1,
                border: '1px dashed rgba(255, 255, 255, 0.1)'
              }}
            >
              {day.workoutExercises.map((exercise, index) => (
                <SortableExercise
                  key={`exercise-${exercise.id}-${day.id}`}
                  id={`exercise-${exercise.id}-${day.id}`}
                  exercise={exercise}
                  dayId={day.id}
                  order={index + 1}
                  onRemove={onRemoveExercise}
                />
              ))}
            </Box>
          </SortableContext>
        )}
      </Box>

      {/* Create Exercise Dialog */}
      <Dialog 
        open={openNewExerciseDialog} 
        onClose={handleCloseNewExerciseDialog}
        PaperProps={{
          sx: {
            background: gradients.surfaceStrong,
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }
        }}
      >
        <DialogTitle sx={{ color: 'white', fontWeight: 600 }}>Create New Exercise</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Exercise Name"
            fullWidth
            value={newExercise.name}
            onChange={(e) => setNewExercise(prev => ({ ...prev, name: e.target.value }))}
            sx={{ 
              mb: 2,
              '& .MuiOutlinedInput-root': {
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: 2,
                color: 'white',
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                },
                '&.Mui-focused': {
                  borderColor: 'rgba(59, 130, 246, 0.5)',
                  boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                },
                '& fieldset': {
                  border: 'none'
                }
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-focused': {
                  color: 'rgba(59, 130, 246, 0.8)'
                }
              },
              '& .MuiInputBase-input': {
                color: 'white'
              }
            }}
          />
          <FormControl fullWidth>
            <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Category</InputLabel>
            <Select
              value={newExercise.category}
              label="Category"
              onChange={(e) => setNewExercise(prev => ({ ...prev, category: e.target.value as ExerciseCategory }))}
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 2,
                  color: 'white',
                  '&:hover': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  '&.Mui-focused': {
                    borderColor: 'rgba(59, 130, 246, 0.5)',
                    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                  },
                  '& fieldset': {
                    border: 'none'
                  }
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&:hover': {
                    color: 'rgba(255, 255, 255, 0.8)'
                  },
                  '&.Mui-focused': {
                    color: 'rgba(59, 130, 246, 0.8)'
                  }
                },
                '& .MuiSelect-icon': {
                  color: 'rgba(255, 255, 255, 0.7)'
                }
              }}
            >
              {Object.values(ExerciseCategory).map((category) => (
                <MenuItem key={category} value={category} sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  {category.charAt(0) + category.slice(1).toLowerCase()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={handleCloseNewExerciseDialog}
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.05)'
              }
            }}
          >
            Cancel
          </Button>
          <GradientButton 
            onClick={handleCreateAndAddExercise}
            disabled={!newExercise.name || !newExercise.category}
            sx={{
              background: gradients.primary,
              border: '1px solid rgba(59, 130, 246, 0.2)',
              color: 'white',
              '&:hover': {
                background: gradients.primaryHover,
                transform: 'translateY(-1px)',
                boxShadow: '0 8px 25px -8px rgba(59, 130, 246, 0.3)'
              },
              '&:disabled': {
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.3)'
              }
            }}
          >
            Create & Add
          </GradientButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
