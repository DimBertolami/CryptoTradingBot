import React, { useEffect, useState, useRef } from 'react';
import { useTheme } from '@mui/material/styles';
import { Button, Grid, Typography, TextField, Select, MenuItem, InputLabel, FormControl, Paper, Snackbar, IconButton, Tooltip, Alert } from '@mui/material';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import CloseIcon from '@mui/icons-material/Close';


const defaultAudioUrl = '/sounds/cash-register.mp3';

interface TradeEvent {
  timestamp: string;
  symbol: string;
  price: number;
  amount: number;
  exchange: string;
  action: string;
  message: string;
  max_trade_amount?: number;
  exchanges?: string[];
  recent_trades?: TradeEvent[];
  entry_time?: string;
  local_max?: number;
  decline_count?: number;
}

interface NightStalkerStatus {
  name: string;
  status: string;
  pid: number | null;
  is_running: boolean;
  mode: string;
  last_updated: string;
  details: {
    metrics: {
      uptime: number;
      requests_handled: number;
      signals_generated: number;
      accuracy: number;
      total_trades: number;
      win_rate: number;
      profit_loss: number;
      connections: number;
      queries_per_second: number;
    };
    balance: number;
    holdings: Record<string, number>;
    // Add any additional fields as needed
  };
}

const defaultConfig = {
  refresh_seconds: 3,
  coin_age_hours: 24,
  trade_threshold: 1500000,
  invest_amount: 30,
  exit_drop_pct: 0.03,
  exit_decline_count: 3,
  execution_mode: 'autonomous',
  max_wait_seconds: 120,
};

const NightStalkerDashboard: React.FC = () => {
  const theme = useTheme();
  // --- Trending Whale Trades State ---
  const [trending, setTrending] = useState<TradeEvent[]>([]);
  const [trendingError, setTrendingError] = useState<string | null>(null);
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);

  // Fetch trending whale trades
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await fetch('/night_stalker/trending');
        const data = await res.json();
        if (!data.success) throw new Error('Failed to fetch trending whale trades');
        setTrending(data.data);
        setTrendingError(null);
      } catch {
        setTrendingError('Could not load trending whale trades.');
      }
    };
    fetchTrending();
    const interval = setInterval(fetchTrending, 5000);
    return () => clearInterval(interval);
  }, []);

  const [config, setConfig] = useState(defaultConfig);
  const [status, setStatus] = useState<NightStalkerStatus | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);


  // Poll status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/trading/signals_status');
        if (!res.ok) throw new Error('Backend unreachable');
        const data = await res.json();
        setStatus(data);
        setError(null);
      } catch {
        setError('Signals backend unreachable. Please check server connection.');
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  // Handle config update
  const handleConfigChange = (field: string, value: unknown) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleConfigSubmit = async () => {
    try {
      const res = await fetch('/night_stalker/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      setConfig(data.config);
      setSnackbar('Config updated!');
    } catch {
      setSnackbar('Failed to update config');
    }
  };

  // Handle audio file upload
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAudioUrl(URL.createObjectURL(e.target.files[0]));
    }
  };



  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Typography variant="h5" gutterBottom>Night Stalker Mode</Typography>
      {/* Friendly Backend Error Card */}
      {error && (
        <Paper elevation={8} sx={{ p: 4, mb: 4, borderRadius: 4, background: 'var(--error-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ mb: 2, color: 'var(--error-text)', fontWeight: 700 }}>
            Night Stalker backend unreachable.
          </Typography>
          <Typography sx={{ mb: 2, color: 'var(--subtle-text)' }}>
            Please check your server connection and ensure <b>./startup.sh</b> is running.
          </Typography>
          <Button variant="contained" color="primary" onClick={() => window.location.reload()}>Retry</Button>
        </Paper>
      )}
      {/* Trending Whale Trades Section */}
      <Grid container columns={12} spacing={2} wrap="wrap" display="grid" gridTemplateColumns={{ xs: 'repeat(12, 1fr)', sm: 'repeat(12, 1fr)', md: 'repeat(12, 1fr)' }}>
        <Grid sx={{ gridColumn: 'span 12' }}>
          <Paper
            elevation={6}
            sx={{
              mb: 3,
              p: 3,
              borderRadius: 4,
              background: theme.palette.background.paper,
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
              backdropFilter: 'blur(6px)',
              color: '#fff',
              position: 'relative',
              overflow: 'hidden',
              minHeight: 200,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: 1, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              🐋 Trending Whale Trades
            </Typography>
            {trendingError && <Alert severity="error">{trendingError}</Alert>}
            <Grid container columns={12} spacing={2} wrap="wrap" display="grid" gridTemplateColumns={{ xs: 'repeat(12, 1fr)', sm: 'repeat(12, 1fr)', md: 'repeat(12, 1fr)' }}>
              {trending.length === 0 && !trendingError && (
                <Grid sx={{ gridColumn: 'span 12' }}><Typography>Loading whale trades...</Typography></Grid>
              )}
              {trending.map((item, idx) => (
                <Grid key={item.symbol} sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 4', lg: 'span 3' } }}>
                  <Paper
                    elevation={4}
                    sx={{
                      p: 2.5,
                      mb: 2,
                      borderRadius: 3,
                      background: 'rgba(34, 40, 49, 0.92)',
                      color: '#fff',
                      border: '2px solid #1976d2',
                      boxShadow: idx < 3 ? '0 0 16px #00e0ff, 0 0 32px #1976d2' : undefined,
                      position: 'relative',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'scale(1.04) rotate(-1deg)',
                        boxShadow: '0 0 32px #00e0ff, 0 0 64px #1976d2',
                      },
                    }}
                  >
                    <Typography variant="h5" sx={{ fontWeight: 600, letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span style={{fontSize: 28}} role="img" aria-label="whale">🐋</span> {item.symbol}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1, mb: 0.5, color: '#90caf9' }}>
                      Largest Trade:
                    </Typography>
                    <AnimatedCounter value={item.max_trade_amount ?? 0} prefix="$" decimals={0} />
                    <Grid container columns={12} spacing={1} sx={{ mt: 1, mb: 1 }}>
                      {item.exchanges?.map((ex: string) => (
                        <Grid key={ex} sx={{ gridColumn: 'span 1' }}>
                          <Tooltip title={ex}>
                            <span style={{
                              background: '#1976d2',
                              color: '#fff',
                              borderRadius: 12,
                              padding: '2px 10px',
                              fontSize: 13,
                              fontWeight: 500,
                              marginRight: 4,
                              letterSpacing: 0.5,
                              boxShadow: '0 2px 8px rgba(25,118,210,0.2)'
                            }}>{ex}</span>
                          </Tooltip>
                        </Grid>
                      ))}
                    </Grid>
                    <Button
                      variant="outlined"
                      size="small"
                      sx={{ color: '#00e0ff', borderColor: '#00e0ff', mt: 1, mb: 0.5 }}
                      onClick={() => setExpandedSymbol(expandedSymbol === item.symbol ? null : item.symbol)}
                    >
                      {expandedSymbol === item.symbol ? 'Hide Whale Trades' : 'Show Whale Trades'}
                    </Button>
                    {expandedSymbol === item.symbol && (
                      <div style={{ maxHeight: 200, overflowY: 'auto', marginTop: 8 }}>
                        {item.recent_trades?.map((trade: TradeEvent, i: number) => (
                          <Paper key={i} sx={{ p: 1, mb: 1, background: 'rgba(25, 118, 210, 0.10)', color: '#fff', borderLeft: '4px solid #00e0ff' }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {trade.timestamp}
                            </Typography>
                            <Typography variant="body2">
                              <span style={{ fontWeight: 600, color: '#00e0ff' }}>${trade.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                              {' '}@ ${trade.price.toLocaleString(undefined, { maximumFractionDigits: 4 })} ({trade.exchange})
                            </Typography>
                          </Paper>
                        ))}
                      </div>
                    )}
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
        {/* Settings Panel */}
        <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}>
          <Typography variant="subtitle1">Settings</Typography>
          <Tooltip title="Filter coins by age since listing (default: <24h)">
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Coin Age</InputLabel>
              <Select
                value={config.coin_age_hours}
                label="Coin Age"
                onChange={e => handleConfigChange('coin_age_hours', e.target.value)}
              >
                <MenuItem value={24}>{'<24h'}</MenuItem>
                <MenuItem value={48}>{'<48h'}</MenuItem>
                <MenuItem value={168}>{'<1 week'}</MenuItem>
              </Select>
            </FormControl>
          </Tooltip>
          <Tooltip title="Minimum trade size (USD) to trigger a buy">
            <TextField
              label="Trade Threshold ($)"
              type="number"
              fullWidth
              sx={{ mt: 2 }}
              value={config.trade_threshold}
              onChange={e => handleConfigChange('trade_threshold', Number(e.target.value))}
            />
          </Tooltip>
          <Tooltip title="How much to invest per trade (EUR)">
            <TextField
              label="Investment Amount (€)"
              type="number"
              fullWidth
              sx={{ mt: 2 }}
              value={config.invest_amount}
              onChange={e => handleConfigChange('invest_amount', Number(e.target.value))}
            />
          </Tooltip>
          <Tooltip title="Sell if price drops by this percent from local max (0.03 = 3%)">
            <TextField
              label="Exit Drop %"
              type="number"
              fullWidth
              sx={{ mt: 2 }}
              value={config.exit_drop_pct}
              onChange={e => handleConfigChange('exit_drop_pct', Number(e.target.value))}
              inputProps={{ step: 0.01, min: 0, max: 1 }}
            />
          </Tooltip>
          <Tooltip title="Sell if price declines for this many checks after peak">
            <TextField
              label="Decline Count"
              type="number"
              fullWidth
              sx={{ mt: 2 }}
              value={config.exit_decline_count}
              onChange={e => handleConfigChange('exit_decline_count', Number(e.target.value))}
            />
          </Tooltip>
          <Tooltip title="Choose how the bot executes trades and alerts you">
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Execution Mode</InputLabel>
              <Select
                value={config.execution_mode}
                label="Execution Mode"
                onChange={e => handleConfigChange('execution_mode', e.target.value)}
              >
                <MenuItem value={'manual'}>Manual</MenuItem>
                <MenuItem value={'assisted'}>Assisted</MenuItem>
                <MenuItem value={'autonomous'}>Autonomous</MenuItem>
              </Select>
            </FormControl>
          </Tooltip>
          {config.execution_mode === 'assisted' && (
            <Tooltip title="Max seconds to wait for your response before bot takes over">
              <TextField
                label="Max Wait (seconds)"
                type="number"
                fullWidth
                sx={{ mt: 2 }}
                value={config.max_wait_seconds}
                onChange={e => handleConfigChange('max_wait_seconds', Number(e.target.value))}
              />
            </Tooltip>
          )}
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            onClick={handleConfigSubmit}
          >
            Update Config
          </Button>
          <Button
            variant="outlined"
            component="label"
            sx={{ mt: 2 }}
            startIcon={<AudiotrackIcon />}
          >
            Upload Alert Sound
            <input type="file" accept="audio/*" hidden onChange={handleAudioUpload} />
          </Button>
          <audio ref={audioRef} src={audioUrl || defaultAudioUrl} style={{ display: 'none' }} />
        </Grid>
        {/* Dashboard */}
        <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 8' } }}>
          <Typography variant="subtitle1">Active Trades</Typography>
          {/* Active trades are not available in the new status structure. Show holdings instead. */}
          {status && Object.keys(status.details.holdings || {}).length === 0 && (
            <Typography>No holdings.</Typography>
          )}
          {status && Object.entries(status.details.holdings || {}).map(([symbol, amount]) => (
            <Paper key={symbol} sx={{ p: 2, mt: 1 }}>
              <Typography><b>{symbol}</b></Typography>
              <Typography>Amount: {amount}</Typography>
            </Paper>
          ))} 
          <Typography variant="subtitle1" sx={{ mt: 2 }}>Recent Trade Events</Typography>
          {/* Trade history is not available in the new status structure. Show metrics summary instead. */}
          {status && (
            <Paper sx={{ p: 1, mt: 1 }}>
              <Typography>Signals Generated: {status.details.metrics.signals_generated}</Typography>
              <Typography>Accuracy: {status.details.metrics.accuracy}%</Typography>
              <Typography>Total Trades: {status.details.metrics.total_trades}</Typography>
              <Typography>Win Rate: {status.details.metrics.win_rate}%</Typography>
              <Typography>Profit/Loss: {status.details.metrics.profit_loss}</Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
      <Snackbar
        open={!!snackbar}
        autoHideDuration={4000}
        onClose={() => setSnackbar(null)}
        message={snackbar}
        action={
          <IconButton size="small" color="inherit" onClick={() => setSnackbar(null)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
    </Paper>
  );
};

// --- Animated Counter Component ---
const AnimatedCounter: React.FC<{ value: number; prefix?: string; decimals?: number }> = ({ value, prefix = '', decimals = 0 }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const start = 0;
    const end = value;
    if (start === end) return;
    let frame = 0;
    const step = () => {
      frame++;
      const progress = Math.min(frame / 30, 1);
      setDisplay(start + (end - start) * progress);
      if (progress < 1) requestAnimationFrame(step);
    };
    step();
     
  }, [value]);
  return (
    <Typography
      variant="h6"
      sx={{ fontWeight: 800, fontSize: 28, color: '#00e0ff', letterSpacing: 1, mb: 1, mt: 0.5, transition: 'color 0.3s' }}
    >
      {prefix}{display.toLocaleString(undefined, { maximumFractionDigits: decimals })}
    </Typography>
  );
};

export default NightStalkerDashboard;

