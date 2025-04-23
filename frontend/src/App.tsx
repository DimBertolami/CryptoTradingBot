import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import { StatusService } from './services/statusService';
import { StatusRequest } from './types/status';
import { useDispatch } from 'react-redux';
import { setAssets } from './features/wallet/walletSlice';
import { sampleAssets } from './data/sampleAssets';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Initialize sample assets
    dispatch(setAssets(sampleAssets));

    // Initialize status updates
    const statusService = StatusService.getInstance();
    const services: StatusRequest['service'][] = ['backend', 'signals', 'paper_trading', 'database'];
    
    const initializeServices = async () => {
      try {
        for (const service of services) {
          await statusService.getStatus(service);
        }
      } catch (error) {
        console.error('Failed to initialize services:', error);
      }
    };

    initializeServices();
  }, [dispatch]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;