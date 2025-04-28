import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import NightStalkerSettings from './NightStalkerSettings';

import NightStalkerDashboard from './NightStalkerDashboard';

const SettingsPage: React.FC = () => {
  return (
    <Paper sx={{ p: 4, mt: 3, borderRadius: 4, background: 'var(--paper-bg)', color: 'var(--paper-text)' }}>
      <Typography variant="h4" sx={{ mb: 2, color: 'var(--paper-heading)' }}>
        Settings
      </Typography>
      <Box sx={{ p: 2 }}>
        
        <NightStalkerDashboard />
        <NightStalkerSettings />
      </Box>
    </Paper>
  );
};

export default SettingsPage;
