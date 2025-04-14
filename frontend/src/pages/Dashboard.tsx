import {
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Card,
  CardContent,
} from '@mui/material';
import { useQuery } from 'react-query';
import { fetchStatus } from '../api/status';
import TimeIntervalSelector from '../components/TimeIntervalSelector';
import PriceChart from '../components/PriceChart';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { setSelectedAsset } from '../features/chart/chartSlice';
import { CryptoAsset } from '../types/chart';
import ErrorBoundary from '../components/ErrorBoundary';

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const selectedInterval = useAppSelector((state) => state.timeInterval.interval);
  const assets = useAppSelector((state) => state.wallet?.assets || []);

  const { data: backendStatus, isLoading: isBackendLoading, error: backendError } = useQuery(
    'backendStatus',
    () => fetchStatus('/api/v1/status/backend'),
    {
      retry: 1,
      refetchOnWindowFocus: false,
    }
  );

  const { data: tradingStatus, isLoading: isTradingLoading, error: tradingError } = useQuery(
    'tradingStatus',
    () => fetchStatus('/api/v1/status/trading'),
    {
      retry: 1,
      refetchOnWindowFocus: false,
    }
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success.main';
      case 'inactive':
        return 'warning.main';
      case 'error':
        return 'error.main';
      default:
        return 'grey.500';
    }
  };

  const handleAssetChange = (asset: { id: string; name: string; symbol: string } | undefined) => {
    if (asset) {
      const cryptoAsset: CryptoAsset = {
        symbol: asset.symbol,
        name: asset.name,
        balance: 0,
        price: 0,
      };
      dispatch(setSelectedAsset(cryptoAsset));
    }
  };

  return (
    <ErrorBoundary>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h4" component="h1" gutterBottom>
            Trading Bot Dashboard
          </Typography>
          <TimeIntervalSelector />
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Backend Status
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {isBackendLoading ? (
                  <CircularProgress size={24} />
                ) : backendError ? (
                  <Typography variant="h5" color="error">
                    Error loading status
                  </Typography>
                ) : (
                  <Typography
                    variant="h5"
                    sx={{
                      color: getStatusColor(backendStatus?.status || 'unknown'),
                    }}
                  >
                    {backendStatus?.status || 'Unknown'}
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Trading Status
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {isTradingLoading ? (
                  <CircularProgress size={24} />
                ) : tradingError ? (
                  <Typography variant="h5" color="error">
                    Error loading status
                  </Typography>
                ) : (
                  <Typography
                    variant="h5"
                    sx={{
                      color: getStatusColor(tradingStatus?.status || 'unknown'),
                    }}
                  >
                    {tradingStatus?.status || 'Unknown'}
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Price Chart ({selectedInterval})
            </Typography>
            {assets.length === 0 ? (
              <Typography variant="body1" color="text.secondary">
                No assets available. Please add assets to your portfolio.
              </Typography>
            ) : (
              <PriceChart assets={assets} onAssetChange={handleAssetChange} />
            )}
          </Paper>
        </Grid>
      </Grid>
    </ErrorBoundary>
  );
};

export default Dashboard;