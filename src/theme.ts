import { createTheme } from '@mui/material/styles';
import type { Components, Theme } from '@mui/material/styles';

const theme = createTheme({
  components: {
    MuiContainer: {
      defaultProps: {
        maxWidth: 'lg',
      },
      styleOverrides: {
        root: {
          '&.MuiContainer-root': {
            padding: {
              xs: '0 !important',
              sm: '24px',
            },
            marginTop: {
              xs: '0 !important',
              sm: '32px',
            }
          }
        } as any
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          padding: {
            xs: '8px',
            sm: '24px',
          },
          borderRadius: {
            xs: '0',
            sm: '4px',
          }
        } as any
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          height: '100%',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          '&:last-child': {
            paddingBottom: 16,
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
  typography: {
    button: {
      textTransform: 'none',
    },
  },
});

export default theme; 