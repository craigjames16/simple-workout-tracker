import { Button, ButtonProps } from '@mui/material';
import { styled } from '@mui/material/styles';
import { trackGradient } from './ThemeRegistry';

const GradientButton = styled(Button)<ButtonProps>(() => ({
  background: trackGradient,
  color: 'white',
  '&:hover': {
    background: trackGradient,
  },
}));

export default GradientButton;