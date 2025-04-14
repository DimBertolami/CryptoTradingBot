import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CryptoAsset, ChartConfig } from '../../types/chart';

const initialState = {
  selectedAsset: {
    symbol: 'BTC',
    name: 'Bitcoin',
    balance: 0,
    price: 0,
  } as CryptoAsset,
  config: {
    rsi: {
      enabled: true,
      color: '#f44336',
      lineWidth: 1,
    },
    macd: {
      enabled: true,
      color: '#4caf50',
      lineWidth: 1,
    },
    bollingerBands: {
      enabled: true,
      color: '#ff9800',
      lineWidth: 1,
    },
  } as ChartConfig,
};

export const chartSlice = createSlice({
  name: 'chart',
  initialState,
  reducers: {
    setSelectedAsset: (state, action: PayloadAction<CryptoAsset>) => {
      state.selectedAsset = action.payload;
    },
    toggleIndicator: (state, action: PayloadAction<keyof ChartConfig>) => {
      state.config[action.payload].enabled = !state.config[action.payload].enabled;
    },
  },
});

export const { setSelectedAsset, toggleIndicator } = chartSlice.actions;

export default chartSlice.reducer;