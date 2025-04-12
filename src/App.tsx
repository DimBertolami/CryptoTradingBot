import { useState } from 'react';
import { LayoutDashboard, Settings, Shield, PieChart, BarChart, LineChart as ChartIcon } from 'lucide-react';
import Dashboard from './components/Dashboard';
import PortfolioMetrics from './components/PortfolioMetrics';
import RiskDashboard from './components/RiskDashboard';
import AdvancedRiskDashboard from './components/AdvancedRiskDashboard';
import CryptoCharts from './components/CryptoCharts';

function App() {
  const [activeView, setActiveView] = useState('dashboard');

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'portfolio':
        return <PortfolioMetrics 
          metrics={sampleMetrics} 
          timeRange="month" 
        />;
      case 'charts':
        return <CryptoCharts symbol="BTC" />;
      case 'risk':
        return <RiskDashboard />;
      case 'advanced-risk':
        return <AdvancedRiskDashboard />;
      default:
        return <Dashboard />;
    }
  };

  // Sample metrics data - in production, this would come from your API
  const sampleMetrics = [
    {
      timestamp: new Date().toISOString(),
      totalValue: 100000,
      returns: 0.15,
      volatility: 0.2,
      sharpeRatio: 1.5,
      drawdown: -0.1,
      allocation: {
        BTC: 0.4,
        ETH: 0.3,
        SOL: 0.2,
        USDT: 0.1
      },
      riskMetrics: {
        var: 0.05,
        cvar: 0.07,
        tailRisk: 0.1,
        downsideDeviation: 0.15
      },
      diversificationMetrics: {
        herfindahl: 0.3,
        gini: 0.4,
        effectiveN: 3.5
      }
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 shadow-md">
        <div className="p-4">
          <h1 className="text-2xl font-bold text-blue-400">CryptoWatch</h1>
        </div>
        <nav className="mt-4">
          <button 
            onClick={() => setActiveView('dashboard')}
            className={`w-full flex items-center px-4 py-2 ${activeView === 'dashboard' ? 'bg-gray-700 text-blue-400' : 'text-gray-400 hover:bg-gray-700'}`}
          >
            <LayoutDashboard className="mr-3" size={20} />
            Dashboard
          </button>
          <button 
            onClick={() => setActiveView('portfolio')}
            className={`w-full flex items-center px-4 py-2 ${activeView === 'portfolio' ? 'bg-gray-700 text-blue-400' : 'text-gray-400 hover:bg-gray-700'}`}
          >
            <PieChart className="mr-3" size={20} />
            Portfolio
          </button>
          <button 
            onClick={() => setActiveView('charts')}
            className={`w-full flex items-center px-4 py-2 ${activeView === 'charts' ? 'bg-gray-700 text-blue-400' : 'text-gray-400 hover:bg-gray-700'}`}
          >
            <ChartIcon className="mr-3" size={20} />
            Charts
          </button>
          <button 
            onClick={() => setActiveView('risk')}
            className={`w-full flex items-center px-4 py-2 ${activeView === 'risk' ? 'bg-gray-700 text-blue-400' : 'text-gray-400 hover:bg-gray-700'}`}
          >
            <Shield className="mr-3" size={20} />
            Risk Analysis
          </button>
          <button 
            onClick={() => setActiveView('advanced-risk')}
            className={`w-full flex items-center px-4 py-2 ${activeView === 'advanced-risk' ? 'bg-gray-700 text-blue-400' : 'text-gray-400 hover:bg-gray-700'}`}
          >
            <BarChart className="mr-3" size={20} />
            Advanced Risk
          </button>
          <button 
            onClick={() => setActiveView('settings')}
            className={`w-full flex items-center px-4 py-2 ${activeView === 'settings' ? 'bg-gray-700 text-blue-400' : 'text-gray-400 hover:bg-gray-700'}`}
          >
            <Settings className="mr-3" size={20} />
            Settings
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <header className="bg-gray-800 shadow">
          <div className="px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-100">
              {activeView.charAt(0).toUpperCase() + activeView.slice(1)} Overview
            </h2>
          </div>
        </header>

        <main className="p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;