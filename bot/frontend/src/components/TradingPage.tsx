import React, { useState } from 'react';
import { Button, Paper, Typography, TextField, Box } from '@mui/material';

const TradingPage: React.FC = () => {
  const [mode, setMode] = useState<'paper' | 'live'>('paper');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [showKeys, setShowKeys] = useState(false);

  const handleSwitchToLive = () => setShowKeys(true);
  const handleActivateLive = () => {
    if (apiKey && apiSecret) setMode('live');
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>
        Trading
      </Typography>
      <Paper 
        elevation={0}
        sx={{ 
          p: 4, 
          borderRadius: 4, 
          mb: 4,
          background: 'var(--paper-bg, #fff)',
          color: 'var(--paper-text, #181c24)',
          boxShadow: '0 2px 16px 0 rgba(0,0,0,0.11)',
          border: '2px solid var(--paper-border, #eee)',
        }}
      >
        <Typography 
          variant="h6" 
          gutterBottom 
          sx={{ color: 'var(--paper-heading, #181c24)', fontWeight: 700 }}
        >
          {mode === 'paper' ? 'Paper Trading (Simulated)' : 'Live Trading (Real Money)'}
        </Typography>
        {mode === 'paper' && !showKeys && (
          <Button 
            variant="contained" 
            color="secondary" 
            onClick={handleSwitchToLive} 
            sx={{ mt: 2, fontWeight: 700 }}
          >
            Switch to Live Trading
          </Button>
        )}
        {mode === 'paper' && showKeys && (
          <Box mt={2}>
            <Typography variant="body1" color="warning.main" mb={1}>
              Enter your API keys to activate live trading:
            </Typography>
            <TextField
              label="API Key"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              fullWidth
              margin="normal"
              autoFocus
            />
            <TextField
              label="API Secret"
              value={apiSecret}
              onChange={e => setApiSecret(e.target.value)}
              fullWidth
              margin="normal"
              type="password"
            />
            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
              disabled={!apiKey || !apiSecret}
              onClick={handleActivateLive}
            >
              Activate Live Trading
            </Button>
          </Box>
        )}
        {mode === 'live' && (
          <Typography variant="body1" color="success.main" mt={2}>
            Live trading mode is active. Be careful—real money is at stake!
          </Typography>
        )}
      </Paper>
      {/* Placeholder for trading dashboard/charts */}
      <Typography variant="body2" color="text.secondary">
        (Trading charts and trade controls will appear here.)
      </Typography>
    </Box>
  );
};

export default TradingPage;
