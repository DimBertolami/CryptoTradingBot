import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  TextField,
  Button
} from '@mui/material';
import ExchangeSelector, { Exchange, SUPPORTED_EXCHANGES } from './ExchangeSelector';

interface TradingSettingsProps {
  selectedExchange: string;
  isLiveTrading: boolean;
  apiKey: string;
  apiSecret: string;
  onExchangeChange: (exchange: Exchange) => void;
  onTradingModeChange: (isLive: boolean) => void;
  onApiKeyChange: (key: string) => void;
  onApiSecretChange: (secret: string) => void;
  onSaveSettings: () => void;
}

const TradingSettings: React.FC<TradingSettingsProps> = ({
  selectedExchange,
  isLiveTrading,
  apiKey,
  apiSecret,
  onExchangeChange,
  onTradingModeChange,
  onApiKeyChange,
  onApiSecretChange,
  onSaveSettings
}) => {
  const selectedExchangeData = SUPPORTED_EXCHANGES.find(ex => ex.id === selectedExchange);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Trading Settings
        </Typography>
        
        <Box mb={3}>
          <ExchangeSelector
            selectedExchange={selectedExchange}
            isLiveTrading={isLiveTrading}
            onExchangeChange={onExchangeChange}
            onTradingModeChange={onTradingModeChange}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box mb={3}>
          <FormControlLabel
            control={
              <Switch
                checked={isLiveTrading}
                onChange={(e) => onTradingModeChange(e.target.checked)}
                disabled={selectedExchange === 'paper'}
              />
            }
            label={
              <Typography>
                {isLiveTrading ? 'Live Trading' : 'Paper Trading'}
              </Typography>
            }
          />
          {isLiveTrading && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              Live trading mode enabled. Real funds will be used.
            </Alert>
          )}
        </Box>

        {selectedExchangeData?.isLiveEnabled && (
          <>
            <Divider sx={{ my: 2 }} />
            
            <Box mb={2}>
              <Typography variant="subtitle1" gutterBottom>
                API Configuration
              </Typography>
              <TextField
                fullWidth
                label="API Key"
                type="password"
                value={apiKey}
                onChange={(e) => onApiKeyChange(e.target.value)}
                margin="normal"
              />
              <TextField
                fullWidth
                label="API Secret"
                type="password"
                value={apiSecret}
                onChange={(e) => onApiSecretChange(e.target.value)}
                margin="normal"
              />
            </Box>
          </>
        )}

        {selectedExchangeData && (
          <Box mt={3}>
            <Typography variant="subtitle1" gutterBottom>
              Features
            </Typography>
            <ul>
              {selectedExchangeData.features.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
          </Box>
        )}

        <Box mt={3}>
          <Button
            variant="contained"
            color="primary"
            onClick={onSaveSettings}
            fullWidth
          >
            Save Settings
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TradingSettings;
