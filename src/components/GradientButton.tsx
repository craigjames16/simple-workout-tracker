import { Button, ButtonProps } from '@mui/material';
import { styled } from '@mui/material/styles';
import { gradients, borders } from '@/lib/theme-constants';

const GradientButton = styled(Button)<ButtonProps>(() => ({
  // Modern glass-style look with blue accent
  background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(29, 78, 216, 0.1) 100%)',
  backdropFilter: 'blur(10px)',
  color: 'rgba(255,255,255,0.95)',
  border: '1px solid rgba(37, 99, 235, 0.3)',
  '&:hover': {
    background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.25) 0%, rgba(29, 78, 216, 0.2) 100%)',
    border: '1px solid rgba(37, 99, 235, 0.5)',
  },
  '&:active': {
    background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.35) 0%, rgba(29, 78, 216, 0.3) 100%)',
    border: '1px solid rgba(37, 99, 235, 0.6)',
  },
}));

export default GradientButton;