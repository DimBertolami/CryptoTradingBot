import React from 'react';
import { Box, Typography } from '@mui/material';

const TestComponent: React.FC = () => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4">Test Component</Typography>
      <Typography variant="body1">
        If you can see this, React and Material-UI are working correctly!
      </Typography>
    </Box>
  );
};

export default TestComponent;
