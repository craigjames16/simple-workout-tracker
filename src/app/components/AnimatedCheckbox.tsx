import { motion } from "framer-motion";
import { Check } from "@mui/icons-material";
import { styled } from '@mui/material/styles';

interface AnimatedCheckboxProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  size?: "small" | "medium" | "large";
}

const StyledButton = styled(motion.button)(({ theme }) => ({
  width: '20px',
  height: '20px',
  borderRadius: '2px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: `1px solid ${theme.palette.grey[500]}`,
  backgroundColor: 'transparent',
  cursor: 'pointer',
  padding: 0,
  '&[data-checked="true"]': {
    backgroundColor: '#2e7d32',
    border: 'none'
  },
  '&:disabled': {
    opacity: 0.5,
    cursor: 'not-allowed'
  },
  '&:not(:disabled):hover': {
    borderColor: '#2e7d32'
  }
}));

export function AnimatedCheckbox({ 
  checked, 
  onChange, 
  disabled = false
}: AnimatedCheckboxProps) {
  return (
    <StyledButton
      onClick={onChange}
      disabled={disabled}
      data-checked={checked}
      whileHover={!disabled ? { scale: 1.05 } : undefined}
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
      >
        <Check sx={{ color: 'white', fontSize: 16 }} />
      </motion.div>
    </StyledButton>
  );
} 