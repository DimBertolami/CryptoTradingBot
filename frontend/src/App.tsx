import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { customTheme } from './theme';
import Dashboard from './components/dashboard/Dashboard';
import TradingView from './components/trading/TradingView';
import RiskManager from './components/risk/RiskManager';
import Portfolio from './components/portfolio/Portfolio';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Sidebar from './components/layout/Sidebar';

const App: React.FC = () => {
  return (
    <ThemeProvider theme={customTheme}>
      <CssBaseline />
      <Router>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Header />
            <main style={{ flex: 1, overflow: 'auto', padding: '2rem' }}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/trading" element={<TradingView />} />
                <Route path="/risk" element={<RiskManager />} />
                <Route path="/portfolio" element={<Portfolio />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </div>
      </Router>
    </ThemeProvider>
  );
};

export default App;
