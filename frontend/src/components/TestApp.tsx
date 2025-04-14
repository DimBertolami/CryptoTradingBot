import React from 'react';
import { Typography } from '@mui/material';

const TestApp: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
      <Typography variant="h4">Test App</Typography>
      <Typography variant="body1">
        If you can see this, React and Material-UI are working correctly!
      </Typography>
    </div>
  );
};

export default TestApp;
