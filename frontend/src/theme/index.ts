import { createTheme, ThemeOptions } from '@mui/material/styles';
import { red, blue, green, orange, purple, grey } from '@mui/material/colors';

const palette = {
  primary: {
    main: '#2563eb',
    light: '#60a5fa',
    dark: '#1d4ed8',
  },
  secondary: {
    main: '#10b981',
    light: '#34d399',
    dark: '#059669',
  },
  error: {
    main: '#ef4444',
    light: '#fca5a5',
    dark: '#dc2626',
  },
  warning: {
    main: '#f59e0b',
    light: '#fcd34d',
    dark: '#d97706',
  },
  info: {
    main: '#3b82f6',
    light: '#60a5fa',
    dark: '#1d4ed8',
  },
  success: {
    main: '#10b981',
    light: '#34d399',
    dark: '#059669',
  },
  background: {
    default: '#0f172a',
    paper: '#1e293b',
    contrast: '#0c192c',
  },
  text: {
    primary: '#f8fafc',
    secondary: '#94a3b8',
    disabled: '#64748b',
  },
  divider: '#334155',
  action: {
    active: '#64748b',
    hover: '#475569',
    selected: '#334155',
    disabled: '#334155',
  },
};

const typography = {
  fontFamily: [
    'Inter',
    'Roboto',
    'Helvetica',
    'Arial',
    'sans-serif',
  ].join(','),
  h1: {
    fontSize: '2.5rem',
    fontWeight: 600,
    letterSpacing: '-0.02em',
  },
  h2: {
    fontSize: '2rem',
    fontWeight: 600,
    letterSpacing: '-0.02em',
  },
  h3: {
    fontSize: '1.75rem',
    fontWeight: 600,
    letterSpacing: '-0.02em',
  },
  h4: {
    fontSize: '1.5rem',
    fontWeight: 600,
    letterSpacing: '-0.02em',
  },
  h5: {
    fontSize: '1.25rem',
    fontWeight: 600,
    letterSpacing: '-0.02em',
  },
  h6: {
    fontSize: '1rem',
    fontWeight: 600,
    letterSpacing: '-0.02em',
  },
  subtitle1: {
    fontSize: '1.125rem',
    fontWeight: 500,
  },
  subtitle2: {
    fontSize: '1rem',
    fontWeight: 500,
  },
  body1: {
    fontSize: '1rem',
    fontWeight: 400,
  },
  body2: {
    fontSize: '0.875rem',
    fontWeight: 400,
  },
  button: {
    textTransform: 'none',
    fontWeight: 600,
  },
};

const shadows = [
  'none',
  '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)',
  '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)',
  '0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -2px rgba(0, 0, 0, 0.05)',
  '0px 14px 28px -2px rgba(0, 0, 0, 0.1), 0px 10px 10px -5px rgba(0, 0, 0, 0.04)',
];

const theme: ThemeOptions = {
  palette,
  typography,
  shadows,
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: palette.background.default,
          color: palette.text.primary,
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: palette.background.paper,
          borderRadius: 16,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          padding: '4px 12px',
          fontSize: '0.875rem',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: palette.background.paper,
          color: palette.text.primary,
          borderRadius: 8,
          padding: '8px 16px',
          fontSize: '0.875rem',
        },
      },
    },
  },
};

export const customTheme = createTheme(theme);
