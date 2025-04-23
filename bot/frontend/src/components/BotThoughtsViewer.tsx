import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  CircularProgress
} from '@mui/material';
import { format } from 'date-fns';

interface BotThought {
  id: number;
  timestamp: string;
  thought_content: string;
}

export const BotThoughtsViewer: React.FC = () => {
  const [thoughts, setThoughts] = useState<BotThought[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchThoughts = async () => {
      try {
        const response = await fetch('/api/bot-thoughts');
        if (!response.ok) {
          throw new Error('Failed to fetch bot thoughts');
        }
        const data = await response.json();
        setThoughts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchThoughts();
    // Refresh every 30 seconds
    const interval = setInterval(fetchThoughts, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">Error: {error}</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        Bot Thoughts History
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>Thought</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {thoughts.map((thought) => (
              <TableRow key={thought.id}>
                <TableCell>
                  {format(new Date(thought.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                </TableCell>
                <TableCell>{thought.thought_content}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default BotThoughtsViewer;
