import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { store } from './app/store';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from 'react-query';
import ErrorBoundary from './components/ErrorBoundary';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

console.log('Main.tsx loaded');

const container = document.getElementById('root');
if (!container) {
  console.error('Failed to find root element');
  throw new Error('Failed to find the root element');
}

console.log('Root element found');
const root = createRoot(container);

console.log('Setting up root render');
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>
);

console.log('Render completed');
