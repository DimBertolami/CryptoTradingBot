import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Stack,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Slider,
  Alert,
  IconButton,
  Tooltip as MuiTooltip,
  CircularProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  FormGroup,
  Grid,
  CardActionArea,
  CardMedia,
  CardActions,
  Avatar,
  Badge,
  ListItem,
  ListItemText,
  ListItemAvatar,
  List,
  Collapse,
  ExpansionPanel,
  ExpansionPanelSummary,
  ExpansionPanelDetails,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Warning,
  Error,
  CheckCircle,
  Info,
  Add,
  Remove,
  Delete,
  Edit,
  SwapHoriz,
  AutoAwesome,
  TrendingUpOutlined,
  TrendingDownOutlined,
  TrendingFlatOutlined,
  WarningOutlined,
  ErrorOutlined,
  CheckCircleOutlined,
  InfoOutlined,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
} from '@mui/icons-material';
import { useInterval } from 'usehooks-ts';
import { ApexOptions } from 'apexcharts';
import Chart from 'react-apexcharts';

// Exchange Data
interface ExchangeData {
  id: string;
  name: string;
  logo: string;
  status: 'active' | 'inactive' | 'error';
  supportedAssets: string[];
  supportedTimeframes: string[];
  rateLimit: number;
  documentation: string;
  apiKey?: string;
  apiSecret?: string;
  lastSync?: Date;
  syncStatus?: 'idle' | 'syncing' | 'error';
  syncProgress?: number;
}

// Exchange Selector Props
interface ExchangeSelectorProps {
  selectedExchanges: string[];
  onExchangeSelect: (exchange: string) => void;
  onExchangeDeselect: (exchange: string) => void;
  onExchangeConfig: (exchange: ExchangeData) => void;
}

// Exchange Grid Item
const ExchangeGridItem: React.FC<ExchangeData> = ({
  id,
  name,
  logo,
  status,
  supportedAssets,
  supportedTimeframes,
  rateLimit,
  documentation,
  lastSync,
  syncStatus,
  syncProgress,
}) => {
  const [expanded, setExpanded] = useState(false);

  // Format number with commas
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 2,
    }).format(num);
  };

  // Status color
  const statusColor = {
    active: '#4caf50',
    inactive: '#f44336',
    error: '#f44336',
  }[status];

  // Sync status color
  const syncStatusColor = {
    idle: '#666',
    syncing: '#2196f3',
    error: '#f44336',
  }[syncStatus || 'idle'];

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        mb: 2,
        position: 'relative',
      }}
    >
      <CardActionArea>
        <CardMedia
          component="img"
          height="140"
          image={logo}
          alt={name}
          sx={{
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        <CardContent sx={{ flexGrow: 1 }}>
          <Typography gutterBottom variant="h6" component="div">
            {name}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Chip
              label={status}
              color={status === 'active' ? 'success' : 'error'}
              size="small"
            />
            <Chip
              label={syncStatus}
              color={syncStatus === 'syncing' ? 'primary' : syncStatus === 'error' ? 'error' : 'default'}
              size="small"
            />
            {syncProgress !== undefined && (
              <Chip
                label={`${Math.round(syncProgress * 100)}%`}
                color="primary"
                size="small"
              />
            )}
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Assets: {formatNumber(supportedAssets.length)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Timeframes: {formatNumber(supportedTimeframes.length)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Rate Limit: {formatNumber(rateLimit)}/min
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Last Sync: {lastSync ? lastSync.toLocaleString() : 'Never'}
          </Typography>
        </CardContent>
      </CardActionArea>
      <CardActions>
        <Button size="small" color="primary" onClick={() => window.open(documentation, '_blank')}>
          Documentation
        </Button>
        <Button size="small" color="primary" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Collapse' : 'Expand'}
        </Button>
      </CardActions>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent>
          <Typography paragraph>Supported Assets:</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {supportedAssets.map((asset) => (
              <Chip key={asset} label={asset} size="small" />
            ))}
          </Stack>
          <Typography paragraph>Supported Timeframes:</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {supportedTimeframes.map((tf) => (
              <Chip key={tf} label={tf} size="small" />
            ))}
          </Stack>
        </CardContent>
      </Collapse>
    </Card>
  );
};

// Exchange Configuration Dialog
const ExchangeConfigDialog: React.FC<{
  exchange: ExchangeData;
  onClose: () => void;
  onSave: (config: ExchangeData) => void;
}> = ({ exchange, onClose, onSave }) => {
  const [config, setConfig] = useState({
    ...exchange,
    apiKey: exchange.apiKey || '',
    apiSecret: exchange.apiSecret || '',
  });

  return (
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Configure {exchange.name}</DialogTitle>
      <DialogContent>
        <Stack spacing={3}>
          <TextField
            fullWidth
            label="API Key"
            value={config.apiKey}
            onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
            type="password"
          />
          <TextField
            fullWidth
            label="API Secret"
            value={config.apiSecret}
            onChange={(e) => setConfig({ ...config, apiSecret: e.target.value })}
            type="password"
          />
          <Typography variant="body2" color="text.secondary">
            Documentation: {exchange.documentation}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Rate Limit: {exchange.rateLimit}/min
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Supported Assets: {exchange.supportedAssets.join(', ')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Supported Timeframes: {exchange.supportedTimeframes.join(', ')}
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={() => onSave(config)} color="primary">
          Save Configuration
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const ExchangeSelector: React.FC<ExchangeSelectorProps> = ({
  selectedExchanges,
  onExchangeSelect,
  onExchangeDeselect,
  onExchangeConfig,
}) => {
  const [exchanges, setExchanges] = useState<ExchangeData[]>([]);
  const [selectedExchange, setSelectedExchange] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [configDialogExchange, setConfigDialogExchange] = useState<ExchangeData | null>(null);

  // Available exchanges
  const AVAILABLE_EXCHANGES: ExchangeData[] = [
    {
      id: 'binance',
      name: 'Binance',
      logo: '/exchanges/binance.png',
      status: 'active',
      supportedAssets: [
        'BTC', 'ETH', 'BNB', 'USDT', 'XRP', 'ADA', 'SOL', 'DOT', 'LINK', 'LTC',
        'UNI', 'AAVE', 'COMP', 'AVAX', 'MATIC', 'DOGE', 'SHIB', 'ETC', 'XMR', 'BCH',
      ],
      supportedTimeframes: ['1m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '12h', '1d'],
      rateLimit: 1200,
      documentation: 'https://binance-docs.github.io/apidocs/spot/en/',
    },
    {
      id: 'bitvavo',
      name: 'Bitvavo',
      logo: '/exchanges/bitvavo.png',
      status: 'active',
      supportedAssets: [
        'BTC', 'ETH', 'USDT', 'XRP', 'ADA', 'SOL', 'DOT', 'LINK', 'LTC',
        'UNI', 'AAVE', 'COMP', 'AVAX', 'MATIC', 'DOGE', 'SHIB', 'ETC', 'XMR', 'BCH',
      ],
      supportedTimeframes: ['1m', '5m', '15m', '30m', '1h', '4h', '1d'],
      rateLimit: 200,
      documentation: 'https://docs.bitvavo.com/',
    },
    {
      id: 'coinbase',
      name: 'Coinbase Pro',
      logo: '/exchanges/coinbase.png',
      status: 'active',
      supportedAssets: [
        'BTC', 'ETH', 'USDT', 'LTC', 'XRP', 'LINK', 'UNI', 'AAVE', 'COMP',
        'AVAX', 'MATIC', 'DOGE', 'ETC', 'XMR', 'BCH', 'SOL', 'DOT', 'ADA',
      ],
      supportedTimeframes: ['1m', '5m', '15m', '1h', '6h', '1d'],
      rateLimit: 3000,
      documentation: 'https://docs.pro.coinbase.com/',
    },
    {
      id: 'kraken',
      name: 'Kraken',
      logo: '/exchanges/kraken.png',
      status: 'active',
      supportedAssets: [
        'BTC', 'ETH', 'USDT', 'XRP', 'LTC', 'ADA', 'DOT', 'LINK',
        'ETC', 'XMR', 'BCH', 'SOL', 'DOGE', 'SHIB', 'AVAX', 'MATIC',
      ],
      supportedTimeframes: ['1m', '5m', '15m', '1h', '4h', '1d', '1w', '1M'],
      rateLimit: 15,
      documentation: 'https://docs.kraken.com/rest/',
    },
    {
      id: 'gateio',
      name: 'Gate.io',
      logo: '/exchanges/gateio.png',
      status: 'active',
      supportedAssets: [
        'BTC', 'ETH', 'USDT', 'XRP', 'ADA', 'SOL', 'DOT', 'LINK', 'LTC',
        'UNI', 'AAVE', 'COMP', 'AVAX', 'MATIC', 'DOGE', 'SHIB', 'ETC', 'XMR', 'BCH',
      ],
      supportedTimeframes: ['1m', '5m', '15m', '1h', '4h', '1d', '1w', '1M'],
      rateLimit: 500,
      documentation: 'https://www.gate.io/docs/api/',
    },
    {
      id: 'kucoin',
      name: 'KuCoin',
      logo: '/exchanges/kucoin.png',
      status: 'active',
      supportedAssets: [
        'BTC', 'ETH', 'USDT', 'XRP', 'ADA', 'SOL', 'DOT', 'LINK', 'LTC',
        'UNI', 'AAVE', 'COMP', 'AVAX', 'MATIC', 'DOGE', 'SHIB', 'ETC', 'XMR', 'BCH',
      ],
      supportedTimeframes: ['1m', '5m', '15m', '1h', '4h', '1d', '1w', '1M'],
      rateLimit: 100,
      documentation: 'https://docs.kucoin.com/',
    },
    {
      id: 'huobi',
      name: 'Huobi',
      logo: '/exchanges/huobi.png',
      status: 'active',
      supportedAssets: [
        'BTC', 'ETH', 'USDT', 'XRP', 'ADA', 'SOL', 'DOT', 'LINK', 'LTC',
        'UNI', 'AAVE', 'COMP', 'AVAX', 'MATIC', 'DOGE', 'SHIB', 'ETC', 'XMR', 'BCH',
      ],
      supportedTimeframes: ['1m', '5m', '15m', '1h', '4h', '1d', '1w', '1M'],
      rateLimit: 200,
      documentation: 'https://huobiapi.github.io/docs/spot/v1/en/',
    },
    {
      id: 'okx',
      name: 'OKX',
      logo: '/exchanges/okx.png',
      status: 'active',
      supportedAssets: [
        'BTC', 'ETH', 'USDT', 'XRP', 'ADA', 'SOL', 'DOT', 'LINK', 'LTC',
        'UNI', 'AAVE', 'COMP', 'AVAX', 'MATIC', 'DOGE', 'SHIB', 'ETC', 'XMR', 'BCH',
      ],
      supportedTimeframes: ['1m', '5m', '15m', '1h', '4h', '1d', '1w', '1M'],
      rateLimit: 200,
      documentation: 'https://www.okx.com/docs-v5/en/',
    },
    {
      id: 'mexc',
      name: 'MEXC',
      logo: '/exchanges/mexc.png',
      status: 'active',
      supportedAssets: [
        'BTC', 'ETH', 'USDT', 'XRP', 'ADA', 'SOL', 'DOT', 'LINK', 'LTC',
        'UNI', 'AAVE', 'COMP', 'AVAX', 'MATIC', 'DOGE', 'SHIB', 'ETC', 'XMR', 'BCH',
      ],
      supportedTimeframes: ['1m', '5m', '15m', '1h', '4h', '1d', '1w', '1M'],
      rateLimit: 100,
      documentation: 'https://mxcdevelop.github.io/apidocs/spot_v3_en/',
    },
  ];

  useEffect(() => {
    setExchanges(AVAILABLE_EXCHANGES);
  }, []);

  const handleExchangeSelect = (exchangeId: string) => {
    onExchangeSelect(exchangeId);
    setSelectedExchange(exchangeId);
  };

  const handleExchangeDeselect = (exchangeId: string) => {
    onExchangeDeselect(exchangeId);
    setSelectedExchange(null);
  };

  const handleExchangeConfig = (exchange: ExchangeData) => {
    setConfigDialogExchange(exchange);
    setShowConfig(true);
  };

  const handleConfigSave = (config: ExchangeData) => {
    onExchangeConfig(config);
    setShowConfig(false);
  };

  const handleConfigClose = () => {
    setShowConfig(false);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Exchange Data Sources
      </Typography>
      
      {/* Selected Exchanges */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="Active Data Sources"
          subheader="Currently selected exchanges for data collection"
        />
        <CardContent>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {selectedExchanges.map((exchangeId) => {
              const exchange = exchanges.find(e => e.id === exchangeId);
              if (!exchange) return null;
              return (
                <Chip
                  key={exchangeId}
                  label={exchange.name}
                  onDelete={() => handleExchangeDeselect(exchangeId)}
                  avatar={
                    <Avatar
                      alt={exchange.name}
                      src={exchange.logo}
                      sx={{ width: 24, height: 24 }}
                    />
                  }
                  onClick={() => handleExchangeConfig(exchange)}
                  sx={{ cursor: 'pointer' }}
                />
              );
            })}
          </Stack>
        </CardContent>
      </Card>

      {/* Available Exchanges */}
      <Card>
        <CardHeader
          title="Available Exchanges"
          subheader="Select exchanges to collect historical data from"
        />
        <CardContent>
          <Grid container spacing={2}>
            {exchanges.map((exchange) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={exchange.id}>
                <ExchangeGridItem
                  {...exchange}
                  onClick={() => handleExchangeSelect(exchange.id)}
                />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Configuration Dialog */}
      {configDialogExchange && (
        <ExchangeConfigDialog
          exchange={configDialogExchange}
          onClose={handleConfigClose}
          onSave={handleConfigSave}
        />
      )}
    </Box>
  );
};

export default ExchangeSelector;