import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { useSpring, animated } from 'react-spring';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: 16,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  },
}));

const PortfolioCard = styled(motion(Box))(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: 8,
  marginBottom: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  },
}));

interface Asset {
  symbol: string;
  name: string;
  quantity: number;
  price: number;
  value: number;
  change: number;
  changePercent: number;
  volatility: number;
  weight: number;
}

const Portfolio: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [assets, setAssets] = useState<Asset[]>([
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      quantity: 0.5,
      price: 45000,
      value: 22500,
      change: 1500,
      changePercent: 3.45,
      volatility: 0.05,
      weight: 0.3,
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      quantity: 3,
      price: 3200,
      value: 9600,
      change: -200,
      changePercent: -6.25,
      volatility: 0.08,
      weight: 0.2,
    },
    {
      symbol: 'SOL',
      name: 'Solana',
      quantity: 15,
      price: 120,
      value: 1800,
      change: 10,
      changePercent: 0.83,
      volatility: 0.12,
      weight: 0.1,
    },
  ]);

  const getChangeColor = (change: number) => {
    return change >= 0 ? theme.palette.success.main : theme.palette.error.main;
  };

  const getTrendIcon = (change: number) => {
    return change > 0 ? (
      <TrendingUpIcon color="success" />
    ) : change < 0 ? (
      <TrendingDownIcon color="error" />
    ) : (
      <TrendingFlat color="primary" />
    );
  };

  const handleQuantityChange = (symbol: string, change: number) => {
    setAssets((prevAssets) =>
      prevAssets.map((asset) =>
        asset.symbol === symbol
          ? {
              ...asset,
              quantity: asset.quantity + change,
              value: (asset.quantity + change) * asset.price,
            }
          : asset
      )
    );
  };

  return (
    <Grid container spacing={3}>
      {/* Portfolio Summary */}
      <Grid item xs={12}>
        <StyledPaper
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h5" component="h3" gutterBottom>
            Portfolio Summary
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Typography variant="h4" component="div">
                ${assets.reduce((sum, asset) => sum + asset.value, 0).toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Value
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="h4" component="div">
                {assets.reduce((sum, asset) => sum + asset.quantity, 0).toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Assets
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="h4" component="div">
                {assets.reduce((sum, asset) => sum + asset.weight, 0).toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Portfolio Weight
              </Typography>
            </Grid>
          </Grid>
        </StyledPaper>
      </Grid>

      {/* Portfolio Holdings */}
      <Grid item xs={12}>
        <StyledPaper
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Typography variant="h6" component="h3" gutterBottom>
            Portfolio Holdings
          </Typography>
          <List>
            {assets.map((asset, index) => (
              <PortfolioCard
                key={asset.symbol}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={2}>
                    <Typography variant="h6" component="div">
                      {asset.symbol}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {asset.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Typography variant="body1">
                      {asset.quantity.toFixed(4)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Quantity
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Typography variant="body1">
                      ${asset.price.toFixed(2)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Price
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Typography variant="body1">
                      ${asset.value.toFixed(2)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Value
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Typography
                      variant="body1"
                      sx={{
                        color: getChangeColor(asset.change),
                      }}
                    >
                      {asset.changePercent.toFixed(2)}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Change
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Tooltip title="Add Quantity">
                        <IconButton
                          onClick={() => handleQuantityChange(asset.symbol, 0.1)}
                          size="small"
                          color="primary"
                        >
                          <AddIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Remove Quantity">
                        <IconButton
                          onClick={() => handleQuantityChange(asset.symbol, -0.1)}
                          size="small"
                          color="error"
                        >
                          <RemoveIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Grid>
                </Grid>
              </PortfolioCard>
            ))}
          </List>
        </StyledPaper>
      </Grid>
    </Grid>
  );
};

export default Portfolio;
