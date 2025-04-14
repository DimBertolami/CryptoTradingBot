import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface WalletState {
  assets: {
    id: string;
    name: string;
    symbol: string;
    balance: number;
    price: number;
    totalValue: number;
  }[];
  loading: boolean;
  error: string | null;
}

const initialState: WalletState = {
  assets: [],
  loading: false,
  error: null,
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setAssets: (state, action: PayloadAction<WalletState['assets']>) => {
      state.assets = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setAssets, setLoading, setError } = walletSlice.actions;

export default walletSlice.reducer;
