import { configureStore } from '@reduxjs/toolkit';
import tradingReducer from './tradingSlice';
import chartReducer from '../features/chart/chartSlice';
import timeIntervalReducer from '../features/timeInterval/timeIntervalSlice';
import walletReducer from '../features/wallet/walletSlice';

export const store = configureStore({
  reducer: {
    trading: tradingReducer,
    chart: chartReducer,
    timeInterval: timeIntervalReducer,
    wallet: walletReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;