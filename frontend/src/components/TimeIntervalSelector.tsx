import React, { useState } from 'react';
import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  createTheme,
  ThemeProvider,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  selectTimeInterval,
  setTimeInterval,
} from '../features/timeInterval/timeIntervalSlice';

// Define time intervals with their display names and API values
export type TimeInterval = '1m' | '5m' | '10m' | '30m' | '1h' | '1d' | '1y';

const timeIntervals: { [key: string]: { label: string; value: TimeInterval } } = {
  '1m': { label: '1m', value: '1m' },
  '5m': { label: '5m', value: '5m' },
  '10m': { label: '10m', value: '10m' },
  '30m': { label: '30m', value: '30m' },
  '1h': { label: '1h', value: '1h' },
  '1d': { label: '1d', value: '1d' },
  '1y': { label: '1y', value: '1y' },
};

const theme = createTheme({
  components: {
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          minWidth: '40px',
          '&.Mui-selected': {
            backgroundColor: '#2196f3',
            color: 'white',
          },
        },
      },
    },
  },
});

interface TimeIntervalSelectorProps {
  onChange?: (interval: TimeInterval) => void;
}

export const TimeIntervalSelector: React.FC<TimeIntervalSelectorProps> = ({ onChange }) => {
  const dispatch = useAppDispatch();
  const currentInterval = useAppSelector(selectTimeInterval);

  const handleIntervalChange = (
    _event: React.MouseEvent<HTMLElement>,
    newInterval: string
  ) => {
    if (newInterval !== null) {
      dispatch(setTimeInterval(newInterval as TimeInterval));
      if (onChange) {
        onChange(newInterval as TimeInterval);
      }
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Time Interval
        </Typography>
        <ToggleButtonGroup
          value={currentInterval}
          exclusive
          onChange={handleIntervalChange}
          size="small"
        >
          {Object.entries(timeIntervals).map(([key, { label, value }]) => (
            <ToggleButton key={key} value={value}>
              {label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
    </ThemeProvider>
  );
};

export default TimeIntervalSelector;