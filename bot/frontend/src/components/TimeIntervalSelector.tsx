import React from 'react';
import { Paper, Button } from '@mui/material';

const PERIODS = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'];

import { Sun, Moon } from 'lucide-react';
import ColorLensIcon from '@mui/icons-material/ColorLens';

interface TimeIntervalSelectorProps {
  selectedPeriod: string;
  onSelect: (period: string) => void;
  appTheme: 'light' | 'dark' | 'rainbow';
  onThemeChange: (theme: 'light' | 'dark' | 'rainbow') => void;
}

const TimeIntervalSelector: React.FC<TimeIntervalSelectorProps> = ({ selectedPeriod, onSelect, appTheme, onThemeChange }) => {
  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        left: 0,
        bottom: 0,
        width: '100vw',
        zIndex: 1300,
        py: 1.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(12px)',
        background: theme => theme.palette.background.paper,
        boxShadow: '0 -4px 24px 0 rgba(0,0,0,0.16)',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        transition: 'background 0.6s',
      }}
    >
      <div style={{ position: 'absolute', right: 32, display: 'flex', gap: 6, alignItems: 'center' }}>
        <Button
          onClick={() => onThemeChange('light')}
          variant={appTheme === 'light' ? 'contained' : 'outlined'}
          color={appTheme === 'light' ? 'warning' : 'inherit'}
          sx={{ 
            minWidth: 36, borderRadius: 3, p: 1, mx: 0.5,
            color: 'var(--bottom-bar-text, #181c24)',
            borderColor: appTheme === 'light' ? 'var(--bottom-bar-selected, #0a2342)' : 'var(--bottom-bar-border, #444)',
            background: appTheme === 'light' ? 'var(--bottom-bar-bg, #fff)' : undefined,
          }}
        >
          <Sun size={20} style={{ color: 'var(--bottom-bar-text, #181c24)' }} />
        </Button>
        <Button
          onClick={() => onThemeChange('dark')}
          variant={appTheme === 'dark' ? 'contained' : 'outlined'}
          color={appTheme === 'dark' ? 'primary' : 'inherit'}
          sx={{ 
            minWidth: 36, borderRadius: 3, p: 1, mx: 0.5,
            color: 'var(--bottom-bar-text, #FFD700)',
            borderColor: appTheme === 'dark' ? 'var(--bottom-bar-selected, #FFD700)' : 'var(--bottom-bar-border, #444)',
            background: appTheme === 'dark' ? 'var(--bottom-bar-bg, #222733)' : undefined,
          }}
        >
          <Moon size={20} style={{ color: 'var(--bottom-bar-text, #FFD700)' }} />
        </Button>
        <Button
          onClick={() => onThemeChange('rainbow')}
          variant={appTheme === 'rainbow' ? 'contained' : 'outlined'}
          color={appTheme === 'rainbow' ? 'secondary' : 'inherit'}
          sx={{
            minWidth: 36,
            borderRadius: 3,
            p: 1,
            mx: 0.5,
            background: appTheme === 'rainbow' ? 'linear-gradient(90deg, #ff0080, #7928ca, #1fa2ff, #27d7ff, #fffb7d)' : undefined,
            color: appTheme === 'rainbow' ? 'var(--bottom-bar-text, #fff)' : undefined,
            borderColor: appTheme === 'rainbow' ? 'var(--bottom-bar-selected, #FFD700)' : 'var(--bottom-bar-border, #444)',
            '&:hover': {
              background: 'linear-gradient(90deg, #ff0080, #7928ca, #1fa2ff, #27d7ff, #fffb7d)',
              color: 'var(--bottom-bar-text, #fff)',
            },
          }}
        >
          <ColorLensIcon style={{ fontSize: 20, color: 'var(--bottom-bar-text, #FFD700)' }} />
        </Button>
      </div>
      <div style={{ display: 'flex', gap: 12, margin: '0 auto' }}>
        {PERIODS.map(period => (
          <Button
            key={period}
            variant={selectedPeriod === period ? 'contained' : 'outlined'}
            color={selectedPeriod === period ? 'primary' : 'inherit'}
            onClick={() => onSelect(period)}
            sx={{
              minWidth: 56,
              fontWeight: 700,
              fontSize: '1.1rem',
              borderRadius: 4,
              transition: 'all 0.18s',
              boxShadow: selectedPeriod === period ? '0 2px 8px 0 rgba(33, 150, 243, 0.18)' : 'none',
              background: selectedPeriod === period
                ? 'linear-gradient(90deg, #1976d2 70%, #42a5f5 100%)'
                : undefined,
              color: theme => (theme.palette.mode === 'dark' ? 'var(--bottom-bar-text, #FFD700)' : '#192a56'),
              borderColor: selectedPeriod === period ? 'var(--bottom-bar-selected, #FFD700)' : 'var(--bottom-bar-border, #444)',
              '&:hover': {
                background: selectedPeriod === period
                  ? 'linear-gradient(90deg, #1565c0 70%, #1976d2 100%)'
                  : undefined,
                color: theme => (theme.palette.mode === 'dark' ? 'var(--bottom-bar-text, #FFD700)' : '#111'),
              },
            }}
          >
            {period.toUpperCase()}
          </Button>
        ))}
      </div>
    </Paper>
  );
};

export default TimeIntervalSelector;
