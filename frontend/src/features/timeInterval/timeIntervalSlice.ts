import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type TimeInterval = '1m' | '5m' | '10m' | '30m' | '1h' | '1d' | '1y';

interface TimeIntervalState {
  interval: TimeInterval;
}

const initialState: TimeIntervalState = {
  interval: '1m', // Default interval
};

export const timeIntervalSlice = createSlice({
  name: 'timeInterval',
  initialState,
  reducers: {
    setTimeInterval: (state, action: PayloadAction<TimeInterval>) => {
      state.interval = action.payload;
    },
  },
});

export const { setTimeInterval } = timeIntervalSlice.actions;

export const selectTimeInterval = (state: { timeInterval: TimeIntervalState }) =>
  state.timeInterval.interval;

export default timeIntervalSlice.reducer;