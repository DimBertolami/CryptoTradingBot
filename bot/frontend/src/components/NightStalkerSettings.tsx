import React, { useEffect, useState, useRef } from 'react';
import { Button, Typography, TextField, Select, MenuItem, InputLabel, FormControl, Snackbar, IconButton, Tooltip, Alert } from '@mui/material';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import CloseIcon from '@mui/icons-material/Close';

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

const defaultAudioUrl = '/sounds/cash-register.mp3';

const NightStalkerSettings: React.FC = () => {
  const [config, setConfig] = useState(defaultConfig);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // Fetch current config from backend
    const fetchConfig = async () => {
      try {
        const res = await fetch('/night_stalker/status');
        if (!res.ok) throw new Error('Backend unreachable');
        const data = await res.json();
        setConfig(data.config);
        setError(null);
      } catch {

        setError('Night Stalker backend unreachable. Please check server connection.');
      }
    };
    fetchConfig();
  }, []);

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

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAudioUrl(URL.createObjectURL(e.target.files[0]));
    }
  };

  const playAudioAlert = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <Typography variant="h6" gutterBottom>Night Stalker Settings</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
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
        onClick={playAudioAlert}
      >
        Upload Alert Sound
        <input type="file" accept="audio/*" hidden onChange={handleAudioUpload} />
      </Button>
      <audio ref={audioRef} src={audioUrl || defaultAudioUrl} style={{ display: 'none' }} />
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
    </div>
  );
};

export default NightStalkerSettings;
