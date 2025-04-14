import React from 'react';
import { Box, Container, Typography } from '@mui/material';

const Settings: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Settings
        </Typography>
        <Typography variant="body1">
          Application settings will be configured here.
        </Typography>
      </Box>
    </Container>
  );
};

export default Settings;
