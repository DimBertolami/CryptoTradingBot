import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { store } from '../app/store';
import { queryClient } from '../app/queryClient';
import App from '../App';

export const Root: React.FC = () => {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </Provider>
  );
};

export default Root;
