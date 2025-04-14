import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface TradingState {
  indicator: string;
  strategy: string;
  riskManagement: {
    stopLoss: number;
    takeProfit: number;
    positionSize: number;
  };
  selectedAsset: {
    id: string;
    name: string;
    symbol: string;
  };
  timeInterval: string;
  chartConfig: {
    indicators: {
      rsi: boolean;
      macd: boolean;
      bollinger: boolean;
    };
  };
}

const initialState: TradingState = {
  indicator: 'DONCHIAN',
  strategy: 'MACHINE_LEARNING',
  riskManagement: {
    stopLoss: 0.015,
    takeProfit: 0.07,
    positionSize: 0.025,
  },
  selectedAsset: {
    id: '',
    name: '',
    symbol: '',
  },
  timeInterval: 'daily',
  chartConfig: {
    indicators: {
      rsi: true,
      macd: true,
      bollinger: true,
    },
  },
};

const tradingSlice = createSlice({
  name: 'trading',
  initialState,
  reducers: {
    setIndicator: (state: TradingState, action: PayloadAction<{ indicator: string; params: any }>) => {
      state.indicator = action.payload.indicator;
    },
    setStrategy: (state: TradingState, action: PayloadAction<string>) => {
      state.strategy = action.payload;
    },
    setRiskManagement: (state: TradingState, action: PayloadAction<{
      stopLoss: number;
      takeProfit: number;
      positionSize: number;
    }>) => {
      state.riskManagement = action.payload;
    },
    setSelectedAsset: (state, action: PayloadAction<TradingState['selectedAsset']>) => {
      state.selectedAsset = action.payload;
    },
    setTimeInterval: (state, action: PayloadAction<string>) => {
      state.timeInterval = action.payload;
    },
    updateChartConfig: (state, action: PayloadAction<Partial<TradingState['chartConfig']>>) => {
      state.chartConfig = { ...state.chartConfig, ...action.payload };
    },
  },
});

export const { 
  setIndicator, 
  setStrategy, 
  setRiskManagement, 
  setSelectedAsset, 
  setTimeInterval, 
  updateChartConfig 
} = tradingSlice.actions;
export default tradingSlice.reducer;
