import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Container, CircularProgress } from '@mui/material';

const Logs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/logs')
      .then(response => response.json())
      .then(data => {
        setLogs(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching logs:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Container maxWidth="md" style={{ marginTop: '2rem' }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" style={{ marginTop: '2rem' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        System Logs
      </Typography>
      
      {logs.length === 0 ? (
        <Typography variant="body1" color="text.secondary">
          No log files found
        </Typography>
      ) : (
        <Paper elevation={3} style={{ padding: '1rem' }}>
          {logs.map((log, index) => (
            <Box key={index} mb={2}>
              <Typography variant="h6" gutterBottom>
                {log.filename}
              </Typography>
              <pre style={{ whiteSpace: 'pre-wrap', overflowX: 'auto' }}>
                {log.content}
              </pre>
            </Box>
          ))}
        </Paper>
      )}
    </Container>
  );
};

export default Logs;
