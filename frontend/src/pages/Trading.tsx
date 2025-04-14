import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import { useAppSelector } from '../app/hooks';

const Trading: React.FC = () => {
  const state = useAppSelector((state) => state);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Trading Dashboard
      </Typography>
      <Box sx={{ mt: 4 }}>
        {/* Add your trading components here */}
      </Box>
    </Container>
  );
};

export default Trading;
