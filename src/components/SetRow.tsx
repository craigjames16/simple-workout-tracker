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
          gridTemplateColumns: { xs: '35px 2fr 2fr 30px 30px', sm: '50px 1fr 1fr 50px 50px' },
          gap: { xs: 2, sm: 2.5 },
          alignItems: 'center',
          p: { xs: 2, sm: 2.5 },
          py: { xs: 2.5, sm: 2.5 },
          borderRadius: 2,
          background: isCompleted 
            ? 'rgba(34, 197, 94, 0.08)' 
            : 'rgba(255, 255, 255, 0.02)',
          border: `1px solid ${isCompleted 
            ? 'rgba(34, 197, 94, 0.2)' 
            : 'rgba(255, 255, 255, 0.08)'}`,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            background: isCompleted 
              ? 'rgba(34, 197, 94, 0.12)' 
              : 'rgba(255, 255, 255, 0.04)',
            borderColor: isCompleted 
              ? 'rgba(34, 197, 94, 0.3)' 
              : 'rgba(255, 255, 255, 0.12)',
            transform: 'translateY(-1px)'
          }
        }}
      >
        {/* Set Number */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          width: { xs: 32, sm: 40 },
          height: { xs: 32, sm: 40 },
          borderRadius: '50%',
          background: isCompleted 
            ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.9) 0%, rgba(22, 163, 74, 0.9) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
          border: `1px solid ${isCompleted 
            ? 'rgba(34, 197, 94, 0.3)' 
            : 'rgba(255, 255, 255, 0.15)'}`,
          backdropFilter: 'blur(8px)',
          color: 'white',
          fontWeight: 700,
          fontSize: { xs: '0.75rem', sm: '0.875rem' },
          margin: '0 auto'
        }}>
          {setIndex + 1}
        </Box>

        {/* Weight Input */}
        <Box sx={{ 
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <Typography 
            variant="caption" 
            sx={{ 
              position: 'absolute',
              top: -18,
              color: 'rgba(156, 163, 175, 0.8)',
              fontSize: { xs: '0.625rem', sm: '0.6875rem' },
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            Weight
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
              minWidth: { xs: 48, sm: 56 },
              '& .MuiOutlinedInput-root': {
                height: { xs: 48, sm: 48 },
                borderRadius: 2,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '& fieldset': { 
                  border: 'none'
                },
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderColor: 'rgba(255, 255, 255, 0.2)'
                },
                '&.Mui-focused': {
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderColor: 'rgba(34, 197, 94, 0.5)',
                  boxShadow: '0 0 0 3px rgba(34, 197, 94, 0.1)'
                }
              },
              '& input': {
                textAlign: 'center',
                fontSize: { xs: '1rem', sm: '1.125rem' },
                fontWeight: 600,
                color: 'white',
                '&::placeholder': {
                  color: 'rgba(156, 163, 175, 0.5)',
                  opacity: 1
                }
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
            <Typography 
              variant="caption" 
              sx={{ 
                position: 'absolute',
                bottom: -20,
                color: 'rgba(156, 163, 175, 0.8)',
                fontSize: { xs: '0.6875rem', sm: '0.6875rem' },
                fontWeight: 500
              }}
            >
              Last: {set.lastSet.weight}
            </Typography>
          )}
        </Box>

        {/* Reps Input */}
        <Box sx={{ 
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <Typography 
            variant="caption" 
            sx={{ 
              position: 'absolute',
              top: -18,
              color: 'rgba(156, 163, 175, 0.8)',
              fontSize: { xs: '0.625rem', sm: '0.6875rem' },
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            Reps
          </Typography>
          <TextField
            size="small"
            fullWidth
            type="number"
            value={set.reps || ''}
            placeholder={set.lastSet ? String(set.lastSet.reps+1) : "0"}
            onChange={(e) => onUpdateSet('reps', parseInt(e.target.value))}
            disabled={isCompleted || isWorkoutCompleted}
            sx={{
              minWidth: { xs: 48, sm: 56 },
              '& .MuiOutlinedInput-root': {
                height: { xs: 48, sm: 48 },
                borderRadius: 2,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '& fieldset': { 
                  border: 'none'
                },
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderColor: 'rgba(255, 255, 255, 0.2)'
                },
                '&.Mui-focused': {
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderColor: 'rgba(34, 197, 94, 0.5)',
                  boxShadow: '0 0 0 3px rgba(34, 197, 94, 0.1)'
                }
              },
              '& input': {
                textAlign: 'center',
                fontSize: { xs: '1rem', sm: '1.125rem' },
                fontWeight: 600,
                color: 'white',
                '&::placeholder': {
                  color: 'rgba(156, 163, 175, 0.5)',
                  opacity: 1
                }
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
            <Typography 
              variant="caption" 
              sx={{ 
                position: 'absolute',
                bottom: -20,
                color: 'rgba(156, 163, 175, 0.8)',
                fontSize: { xs: '0.6875rem', sm: '0.6875rem' },
                fontWeight: 500
              }}
            >
              Last: {set.lastSet.reps}
            </Typography>
          )}
        </Box>

        {/* Set Menu */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <IconButton
            size="small"
            onClick={onMenuOpen}
            disabled={isCompleted || isWorkoutCompleted}
            sx={{ 
              width: { xs: 32, sm: 40 },
              height: { xs: 32, sm: 40 },
              borderRadius: 2,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
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

        {/* Complete Set Button */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          flexDirection: 'column',
          gap: 1 
        }}>
          <AnimatedCheckbox
            checked={isCompleted || isWorkoutCompleted}
            onChange={() => onSetCompletion(!isCompleted)}
            disabled={isWorkoutCompleted}
            size="large"
          />
          {set.adjustment && (
            <Chip
              label="PT"
              size="small"
              sx={{
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