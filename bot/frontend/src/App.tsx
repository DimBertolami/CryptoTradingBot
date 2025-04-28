import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import TimeIntervalSelector from './components/TimeIntervalSelector';
import DashboardPage from './components/DashboardPage';
import TradingPage from './components/TradingPage';
import SettingsPage from './components/SettingsPage';
import { Tabs, Tab, Box } from '@mui/material';

function App() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'rainbow'>('light');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('1m');
  const [tab, setTab] = useState<'dashboard' | 'trading' | 'settings'>('dashboard');

  const SIDEBAR_WIDTH = 280;
  const SIDEBAR_COLLAPSED = 64;

  useEffect(() => {
    // Set dark class for tailwind/dark mode
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Set global CSS variables for tab label colors
    const root = document.documentElement;
    if (theme === 'dark') {
      root.style.setProperty('--tab-selected', '#FFD700'); // gold
      root.style.setProperty('--tab-unselected', '#bfa64b'); // muted gold
      root.style.setProperty('--tab-bg', '#181c24');
      root.style.setProperty('--paper-bg', '#222733');
      root.style.setProperty('--paper-text', '#FFD700');
      root.style.setProperty('--paper-heading', '#FFD700');
      root.style.setProperty('--paper-border', '#FFD700');
      root.style.setProperty('--subtle-text', '#bfa64b');
      // Bottom bar
      root.style.setProperty('--bottom-bar-text', '#FFD700');
      root.style.setProperty('--bottom-bar-selected', '#FFD700');
      root.style.setProperty('--bottom-bar-border', '#bfa64b');
      root.style.setProperty('--bottom-bar-bg', '#181c24');
    } else if (theme === 'light') {
      root.style.setProperty('--tab-selected', '#0a2342'); // dark blue
      root.style.setProperty('--tab-unselected', '#1976d2'); // blue
      root.style.setProperty('--tab-bg', '#fff');
    } else if (theme === 'rainbow') {
      root.style.setProperty('--tab-selected', '#fff');
      root.style.setProperty('--tab-unselected', '#FFD700');
      root.style.setProperty('--tab-bg', 'transparent');
      root.style.setProperty('--paper-bg', 'rgba(255,255,255,0.90)');
      root.style.setProperty('--paper-text', '#7928ca');
      root.style.setProperty('--paper-heading', '#fff');
      root.style.setProperty('--paper-border', '#FFD700');
      root.style.setProperty('--subtle-text', '#FFD700');
      // Bottom bar
      root.style.setProperty('--bottom-bar-text', '#fff');
      root.style.setProperty('--bottom-bar-selected', '#FFD700');
      root.style.setProperty('--bottom-bar-border', '#FFD700');
      root.style.setProperty('--bottom-bar-bg', 'transparent');
    }
  }, [theme]);

  return (
    <div
      className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : theme === 'rainbow' ? '' : 'bg-gray-50'}`}
      style={theme === 'rainbow' ? {
        background: 'linear-gradient(135deg, #ff0080 0%, #7928ca 25%, #1fa2ff 50%, #27d7ff 75%, #fffb7d 100%)',
        backgroundSize: '200% 200%',
        animation: 'rainbow-bg 8s ease-in-out infinite',
      } : {}}
    >
      {/* Main Content */}
      <main
        className="flex-1 transition-all duration-300"
        style={{
          marginLeft: isSidebarOpen ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED,
          padding: '32px 24px 24px 24px',
          minHeight: '100vh',
          background: 'inherit',
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            aria-label="Main navigation"
            TabIndicatorProps={{
              style: {
                background: 'var(--tab-selected)',
                height: 4,
                borderRadius: 2,
              },
            }}
            sx={{
              background: 'var(--tab-bg)',
              borderRadius: 2,
              minHeight: 48,
            }}
          >
            <Tab 
              label="Dashboard"
              value="dashboard"
              sx={{
                fontWeight: 700,
                fontSize: '1.1rem',
                color: tab === 'dashboard' ? 'var(--tab-selected)' : 'var(--tab-unselected)',
                textShadow: tab === 'dashboard' ? '0 1px 8px rgba(0,0,0,0.15)' : 'none',
                transition: 'color 0.18s',
                minHeight: 48,
              }}
            />
            <Tab 
              label="Trading"
              value="trading"
              sx={{
                fontWeight: 700,
                fontSize: '1.1rem',
                color: tab === 'trading' ? 'var(--tab-selected)' : 'var(--tab-unselected)',
                textShadow: tab === 'trading' ? '0 1px 8px rgba(0,0,0,0.15)' : 'none',
                transition: 'color 0.18s',
                minHeight: 48,
              }}
            />
            <Tab 
              label="Settings"
              value="settings"
              sx={{
                fontWeight: 700,
                fontSize: '1.1rem',
                color: tab === 'settings' ? 'var(--tab-selected)' : 'var(--tab-unselected)',
                textShadow: tab === 'settings' ? '0 1px 8px rgba(0,0,0,0.15)' : 'none',
                transition: 'color 0.18s',
                minHeight: 48,
              }}
            />
          </Tabs>
        </Box>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {tab === 'dashboard' ? 'Dashboard' : 'Trading'}
          </h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
        {tab === 'dashboard' && (
          <DashboardPage selectedPeriod={selectedPeriod} />
        )}
        {tab === 'trading' && (
          <TradingPage />
        )}
        {tab === 'settings' && (
          <SettingsPage />
        )}
      </main>
      {/* Global Time Interval Selector (fixed at bottom) */}
      <TimeIntervalSelector
        selectedPeriod={selectedPeriod}
        onSelect={setSelectedPeriod}
        appTheme={theme}
        onThemeChange={setTheme}
      />
    </div>
  );
}

// Rainbow animation keyframes
const style = document.createElement('style');
style.innerHTML = `
@keyframes rainbow-bg {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}`;
if (!document.head.querySelector('#rainbow-bg-keyframes')) {
  style.id = 'rainbow-bg-keyframes';
  document.head.appendChild(style);
}

export default App;