import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#8dd348',
      light: '#54b175',
      dark: '#2c6e47',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#f8f8f8',
      light: '#ffffff',
      dark: '#e0e0e0',
      contrastText: '#333333',
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
    },
    background: {
      default: '#ffffff',
      paper: '#f8f8f8',
    },
    error: {
      main: '#e63946',
    },
  },
  typography: {
    fontFamily:
      'Poppins, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.75rem', // ~44px
      lineHeight: 1.2,
      letterSpacing: '-0.5px',
      '@media (max-width:900px)': { fontSize: '2.25rem' },
      '@media (max-width:600px)': { fontSize: '2rem' },
    },
    h2: {
      fontWeight: 700,
      fontSize: '2.25rem', // ~36px
      lineHeight: 1.3,
      letterSpacing: '-0.3px',
      '@media (max-width:900px)': { fontSize: '2rem' },
      '@media (max-width:600px)': { fontSize: '1.75rem' },
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem', // ~28px
      lineHeight: 1.35,
      '@media (max-width:600px)': { fontSize: '1.5rem' },
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem', // ~24px
      lineHeight: 1.4,
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem', // ~20px
      lineHeight: 1.5,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.125rem', // ~18px
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem', // 16px
      lineHeight: 1.8,
      fontWeight: 400,
    },
    body2: {
      fontSize: '0.9375rem', // 15px
      lineHeight: 1.75,
      fontWeight: 400,
    },
    button: {
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: 1,
      fontSize: '0.875rem',
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.6,
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.6,
    },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollBehavior: 'smooth',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 30,
          padding: '12px 28px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)',
            // transform: 'translateY(-3px)',
          },
          transition: 'all 0.3s ease',
          fontWeight: 600,
        },
        containedPrimary: {
          backgroundColor: '#8dd348',
          '&:hover': {
            backgroundColor: '#54b175',
          },
        },
        outlinedPrimary: {
          borderColor: '#8dd348',
          color: '#8dd348',
          borderWidth: 2,
          '&:hover': {
            backgroundColor: 'rgba(58, 143, 94, 0.04)',
            borderColor: '#54b175',
            borderWidth: 2,
          },
        },
        sizeLarge: {
          padding: '14px 32px',
          fontSize: '1rem',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 5px 15px rgba(0, 0, 0, 0.05)',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            transform: 'translateY(-10px)',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          },
          borderRadius: 8,
          overflow: 'hidden',
        },
      },
    },
    // MuiAppBar: {
    //   styleOverrides: {
    //     root: {
    //       boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
    //     },
    //   },
    // },
    MuiContainer: {
      styleOverrides: {
        root: {
          '@media (min-width: 1200px)': {
            maxWidth: 1200,
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          textDecoration: 'none',
          transition: 'color 0.2s ease',
          '&:hover': {
            textDecoration: 'none',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'transform 0.2s ease, color 0.2s ease',
          '&:hover': {
            transform: 'scale(1.1)',
          },
        },
      },
    },
  },
});

export default theme;
