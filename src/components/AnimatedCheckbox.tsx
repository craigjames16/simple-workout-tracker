import { motion } from "framer-motion";
import { Check } from "@mui/icons-material";
import { styled } from '@mui/material/styles';
import { gradients } from '@/lib/theme-constants';

interface AnimatedCheckboxProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  size?: "small" | "medium" | "large";
}

const StyledButton = styled(motion.button)<{ size?: string }>(({ theme, size }) => {
  const sizeMap = {
    small: { width: '20px', height: '20px', fontSize: '12px' },
    medium: { width: '24px', height: '24px', fontSize: '14px' },
    large: { width: '32px', height: '32px', fontSize: '16px' }
  };
  
  const dimensions = sizeMap[size as keyof typeof sizeMap] || sizeMap.large;
  
  return {
    width: dimensions.width,
    height: dimensions.height,
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    background: 'rgba(255, 255, 255, 0.05)',
    cursor: 'pointer',
    padding: 0,
    margin: 0,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    '&[data-checked="true"]': {
      background: gradients.success,
      borderColor: '#22c55e',
      transform: 'scale(1.05)'
    },
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed'
    },
    '&:not(:disabled):hover': {
      borderColor: '#22c55e',
      transform: 'scale(1.02)'
    }
  };
});

export function AnimatedCheckbox({ 
  checked, 
  onChange, 
  disabled = false,
  size = "large"
}: AnimatedCheckboxProps) {
  return (
    <StyledButton
      onClick={onChange}
      disabled={disabled}
      data-checked={checked}
      size={size}
      whileHover={!disabled ? { scale: checked ? 1.05 : 1.02 } : undefined}
      whileTap={!disabled ? { scale: 0.95 } : undefined}
    >
      <motion.div
        initial={false}
        animate={{
          scale: checked ? 1 : 0,
          opacity: checked ? 1 : 0
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 15,
          mass: 1.2
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          color: 'white',
          fontWeight: 700,
          fontSize: size === 'large' ? '16px' : size === 'medium' ? '14px' : '12px',
          lineHeight: 1
        }}
      >
        ✓
      </motion.div>
    </StyledButton>
  );
} 