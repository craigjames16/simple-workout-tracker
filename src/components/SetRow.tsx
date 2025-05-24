import React, { useRef, forwardRef } from 'react';
import { Box, TextField, IconButton, Typography } from '@/components';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Chip from '@mui/material/Chip';
import { motion } from "framer-motion";
import { AnimatedCheckbox } from '@/components/AnimatedCheckbox';

interface SetRowProps {
  set: {
    id?: number;
    reps: number;
    weight: number;
    completed?: boolean;
    skipped?: boolean;
    adjustment?: boolean;
    lastSet: {
      reps: number;
      weight: number;
    } | null;
  };
  setIndex: number;
  exerciseId: number;
  isCompleted: boolean;
  isWorkoutCompleted: boolean;
  onUpdateSet: (field: 'reps' | 'weight', value: number) => void;
  onMenuOpen: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onSetCompletion: (completed: boolean) => void;
}

const SetRow = forwardRef<HTMLElement, SetRowProps>(({
  set,
  setIndex,
  exerciseId,
  isCompleted,
  isWorkoutCompleted,
  onUpdateSet,
  onMenuOpen,
  onSetCompletion
}, ref) => {
  const hasLastSet = set.lastSet && (set.lastSet.weight > 0 || set.lastSet.reps > 0);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: setIndex * 0.05 }}
    >
      <Box
        ref={ref}
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '32px 1fr 1fr 40px 60px', sm: '40px 1fr 1fr 48px 80px' },
          gap: { xs: 1, sm: 2 },
          alignItems: 'center',
          p: { xs: 1.5, sm: 2 },
          borderRadius: 2,
          bgcolor: isCompleted ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${isCompleted ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255,255,255,0.1)'}`,
          transition: 'all 0.3s ease',
          '&:hover': {
            bgcolor: isCompleted ? 'rgba(76, 175, 80, 0.15)' : 'rgba(255,255,255,0.1)'
          }
        }}
      >
        {/* Set Number */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          width: { xs: 28, sm: 32 },
          height: { xs: 28, sm: 32 },
          borderRadius: '50%',
          bgcolor: isCompleted ? 'success.main' : 'rgba(255,255,255,0.1)',
          color: isCompleted ? 'white' : 'text.secondary',
          fontWeight: 600,
          fontSize: { xs: '0.75rem', sm: '0.875rem' }
        }}>
          {setIndex + 1}
        </Box>

        {/* Weight Input */}
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ 
            mb: 0.5, 
            display: 'block',
            fontSize: { xs: '0.6rem', sm: '0.75rem' }
          }}>
            {window.innerWidth < 450 ? 'Weight' : 'Weight (lbs)'}
          </Typography>
          <TextField
            size="small"
            fullWidth
            type="number"
            value={set.weight || ''}
            placeholder={set.lastSet ? String(set.lastSet.weight) : "0"}
            onChange={(e) => onUpdateSet('weight', parseFloat(e.target.value))}
            disabled={isCompleted || isWorkoutCompleted}
            sx={{
              '& .MuiOutlinedInput-root': {
                height: { xs: 40, sm: 48 },
                bgcolor: 'rgba(255,255,255,0.1)',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                '&.Mui-focused fieldset': { borderColor: 'primary.main' }
              },
              '& input': {
                textAlign: 'center',
                fontSize: { xs: '0.875rem', sm: '1rem' },
                fontWeight: 500
              },
              '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                WebkitAppearance: 'none',
                margin: 0,
              },
              '& input[type=number]': {
                MozAppearance: 'textfield',
              }
            }}
            inputProps={{
              inputMode: 'decimal',
              pattern: '[0-9]*\\.?[0-9]*'
            }}
          />
          {set.lastSet && (
            <Typography variant="caption" color="text.secondary" sx={{ 
              mt: 0.5, 
              display: 'block',
              fontSize: { xs: '0.6rem', sm: '0.75rem' }
            }}>
              Last: {set.lastSet.weight}
            </Typography>
          )}
        </Box>

        {/* Reps Input */}
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ 
            mb: 0.5, 
            display: 'block',
            fontSize: { xs: '0.6rem', sm: '0.75rem' }
          }}>
            Reps
          </Typography>
          <TextField
            size="small"
            fullWidth
            type="number"
            value={set.reps || ''}
            placeholder={set.lastSet ? String(set.lastSet.reps) : "0"}
            onChange={(e) => onUpdateSet('reps', parseInt(e.target.value))}
            disabled={isCompleted || isWorkoutCompleted}
            sx={{
              '& .MuiOutlinedInput-root': {
                height: { xs: 40, sm: 48 },
                bgcolor: 'rgba(255,255,255,0.1)',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                '&.Mui-focused fieldset': { borderColor: 'primary.main' }
              },
              '& input': {
                textAlign: 'center',
                fontSize: { xs: '0.875rem', sm: '1rem' },
                fontWeight: 500
              },
              '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                WebkitAppearance: 'none',
                margin: 0,
              },
              '& input[type=number]': {
                MozAppearance: 'textfield',
              }
            }}
            inputProps={{
              inputMode: 'numeric',
              pattern: '[0-9]*'
            }}
          />
          {set.lastSet && (
            <Typography variant="caption" color="text.secondary" sx={{ 
              mt: 0.5, 
              display: 'block',
              fontSize: { xs: '0.6rem', sm: '0.75rem' }
            }}>
              Last: {set.lastSet.reps}
            </Typography>
          )}
        </Box>

        {/* Set Menu */}
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <IconButton
            size="small"
            onClick={onMenuOpen}
            disabled={isCompleted || isWorkoutCompleted}
            sx={{ 
              width: { xs: 32, sm: 40 },
              height: { xs: 32, sm: 40 },
              bgcolor: 'rgba(255,255,255,0.1)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
            }}
          >
            <MoreVertIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
          </IconButton>
        </Box>

        {/* Complete Set Button */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AnimatedCheckbox
            checked={isCompleted || isWorkoutCompleted}
            onChange={() => onSetCompletion(!isCompleted)}
            disabled={isWorkoutCompleted}
            size={window.innerWidth < 450 ? "medium" : "large"}
          />
          {set.adjustment && (
            <Chip
              label="PT"
              size="small"
              sx={{
                ml: 1,
                height: '20px',
                backgroundColor: 'rgba(156, 39, 176, 0.2)',
                color: 'rgb(156, 39, 176)',
                border: '1px solid rgba(156, 39, 176, 0.3)',
                '& .MuiChip-label': {
                  px: 1,
                  fontSize: '0.625rem',
                  fontWeight: 600
                }
              }}
            />
          )}
        </Box>
      </Box>
    </motion.div>
  );
});

SetRow.displayName = 'SetRow';

export default SetRow; 