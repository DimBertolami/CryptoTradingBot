import React, { useState, useEffect, useCallback } from 'react';
import './BackendStatusDashboard.css';

type ServiceKey = 'backend' | 'signals' | 'paper_trading' | 'database';

const endpoints: Record<ServiceKey, string> = {
  backend: 'http://localhost:5001/trading/backend_status',
  signals: 'http://localhost:5001/trading/signals_status',
  paper_trading: 'http://localhost:5001/trading/paper_trading_status',
  database: 'http://localhost:5001/trading/database_status'
};

const fetchOptions = {
  method: 'GET',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  },
  mode: 'cors' as RequestMode
};

interface ServiceStatus {
  name: string;
  status: string;
  pid: number | null;
  is_running: boolean;
  mode: string;
  last_updated: string;
  details: {
    metrics?: {
      uptime?: number;
      requests_handled?: number;
      signals_generated?: number;
      accuracy?: number;
      total_trades?: number;
      win_rate?: number;
      profit_loss?: number;
      connections?: number;
      queries_per_second?: number;
    };
    balance?: number;
    holdings?: Record<string, number>;
  };
}

interface LogStatus {
  path: string;
  last_modified: string;
}

interface BackendStatus {
  timestamp: string;
  services: {
    backend: ServiceStatus;
    signals: ServiceStatus;
    paper_trading: ServiceStatus;
    database: ServiceStatus;
  };
  logs: {
    backend: LogStatus;
    signals: LogStatus;
    paper_trading: LogStatus;
  };
  error?: string;
}

const BackendStatusDashboard: React.FC = () => {
  const [status, setStatus] = useState<BackendStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [resolvingAll, setResolvingAll] = useState<boolean>(false);

  // Attempt to ping each service to determine availability
  const checkServiceAvailability = useCallback(async () => {
    try {
      // Start with fallback data
      const currentStatus = generateFallbackStatus();
      currentStatus.timestamp = new Date().toISOString();
      
      // Check each service endpoint
      for (const [service] of Object.entries(endpoints) as [ServiceKey, string][]) {
        try {
          const response = await fetch(endpoints[service], fetchOptions);
          if (response.ok) {
            const serviceStatus = await response.json();
            (currentStatus.services as Record<string, ServiceStatus>)[service] = serviceStatus;
          } else {
            console.log(`Service ${service} check failed:`, response.statusText);
            (currentStatus.services as Record<string, ServiceStatus>)[service].status = 'unreachable';
          }
        } catch (err) {
          console.log(`Service ${service} check failed:`, err);
          (currentStatus.services as Record<string, ServiceStatus>)[service].status = 'unreachable';
        }
      }
      
      setStatus(currentStatus);
      setLastUpdated(new Date());
      setLoading(false);
      setErrorMessage(null);
      
    } catch (error) {
      console.error('Error checking service availability:', error);
      setErrorMessage('Failed to check service status');
      setLoading(false);
    }
  }, []);

  // Effect for auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(checkServiceAvailability, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, checkServiceAvailability]);

  // Initial load
  useEffect(() => {
    checkServiceAvailability();
  }, [checkServiceAvailability]);

  // Format date for display
  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString();
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid Date';
    }
  };

  // Calculate time since last update
  const getTimeSince = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      
      if (diff < 60000) { // Less than 1 minute
        return 'Just now';
      } else if (diff < 3600000) { // Less than 1 hour
        const minutes = Math.floor(diff / 60000);
        return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
      } else if (diff < 86400000) { // Less than 1 day
        const hours = Math.floor(diff / 3600000);
        return `${hours} hour${hours === 1 ? '' : 's'} ago`;
      } else {
        const days = Math.floor(diff / 86400000);
        return `${days} day${days === 1 ? '' : 's'} ago`;
      }
    } catch (e) {
      console.error('Error calculating time since:', e);
      return 'Unknown';
    }
  };

  // Get a color class based on status
  const getStatusColor = (serviceStatus: ServiceStatus): string => {
    if (!serviceStatus.is_running) return 'status-red';
    
    switch (serviceStatus.status.toLowerCase()) {
      case 'active':
        return 'status-green';
      case 'warning':
        return 'status-yellow';
      case 'error':
        return 'status-red';
      default:
        return 'status-gray';
    }
  };

  // Get a descriptive status message
  const getStatusMessage = (serviceStatus: ServiceStatus): string => {
    if (!serviceStatus.is_running) {
      return 'Service is not running';
    }
    
    switch (serviceStatus.status.toLowerCase()) {
      case 'active':
        return 'Service is running normally';
      case 'warning':
        return 'Service is running with warnings';
      case 'error':
        return 'Service is experiencing errors';
      default:
        return 'Status unknown';
    }
  };

  // Calculate overall system health percentage
  const calculateSystemHealth = () => {
    if (!status) return { percentage: 0, label: 'Unknown' };
    
    const services = Object.values(status.services);
    const totalServices = services.length;
    const activeServices = services.filter(s => s.is_running && s.status.toLowerCase() === 'active').length;
    const percentage = Math.round((activeServices / totalServices) * 100);
    
    let label = 'Critical';
    if (percentage === 100) label = 'Healthy';
    else if (percentage >= 75) label = 'Good';
    else if (percentage >= 50) label = 'Warning';
    
    return { percentage, label };
  };

  // Function to attempt to resolve a specific service issue
  const resolveService = async (service: string) => {
    try {
      const response = await fetch(endpoints.backend, fetchOptions);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Service ${service} resolved:`, data);
        await checkServiceAvailability();
      } else {
        console.error(`Failed to resolve ${service}:`, response.statusText);
      }
    } catch (error) {
      console.error(`Error resolving ${service}:`, error);
    }
  };

  // Function to attempt to resolve all backend issues
  const resolveAllServices = async () => {
    setResolvingAll(true);
    try {
      await Promise.all(Object.keys(status?.services || {}).map(resolveService));
      await checkServiceAvailability();
    } catch (error) {
      console.error('Error resolving all services:', error);
    } finally {
      setResolvingAll(false);
    }
  };

  // Generate fallback status data
  const generateFallbackStatus = () => {
    const timestamp = new Date().toISOString();
    return {
      timestamp,
      services: {
        backend: {
          name: 'Trading Engine',
          status: 'unreachable',
          pid: null,
          is_running: false,
          mode: 'unknown',
          last_updated: timestamp,
          details: {
            metrics: {
              uptime: 0,
              requests_handled: 0
            }
          }
        },
        signals: {
          name: 'Signal Generator',
          status: 'unreachable',
          pid: null,
          is_running: false,
          mode: 'unknown',
          last_updated: timestamp,
          details: {
            metrics: {
              signals_generated: 0,
              accuracy: 0
            }
          }
        },
        paper_trading: {
          name: 'Paper Trading',
          status: 'unreachable',
          pid: null,
          is_running: false,
          mode: 'unknown',
          last_updated: timestamp,
          details: {
            balance: 0,
            holdings: {},
            metrics: {
              total_trades: 0,
              win_rate: 0,
              profit_loss: 0
            }
          }
        },
        database: {
          name: 'Database',
          status: 'unreachable',
          pid: null,
          is_running: false,
          mode: 'unknown',
          last_updated: timestamp,
          details: {
            metrics: {
              connections: 0,
              queries_per_second: 0
            }
          }
        }
      },
      logs: {
        backend: {
          path: '../logs/backend.log',
          last_modified: timestamp
        },
        signals: {
          path: '../logs/signals.log',
          last_modified: timestamp
        },
        paper_trading: {
          path: '../logs/paper_trading.log',
          last_modified: timestamp
        }
      }
    } as BackendStatus;
  };

  return (
    <div className="backend-status-dashboard">
      {loading ? (
        <div className="loading-spinner">Loading...</div>
      ) : (
        <div className="status-container">
          <div className="status-header">
            <div className="status-title">
              <h2>Backend Status</h2>
              <div className="health-indicator">
                <div className="health-percentage">
                  <div 
                    className="health-fill"
                    style={{ width: `${calculateSystemHealth().percentage}%` }}
                  ></div>
                </div>
                <span>{calculateSystemHealth().label} ({calculateSystemHealth().percentage}%)</span>
              </div>
            </div>
            <div className="status-controls">
              <button 
                className="refresh-button"
                onClick={() => checkServiceAvailability()}
                disabled={loading}
              >
                Refresh
              </button>
              <label className="auto-refresh-toggle">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                />
                Auto-refresh
              </label>
            </div>
          </div>
          
          <div className="services-grid">
            {status && Object.entries(status.services).map(([key, service]) => (
              <div key={key} className={`service-card ${getStatusColor(service)}`}>
                <div className="service-header">
                  <h3>{service.name}</h3>
                  <span className="status-badge">{service.status}</span>
                </div>
                <div className="service-info">
                  <div className="info-item">
                    <span className="info-label">Status:</span>
                    <span className="info-value">{getStatusMessage(service)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Last Updated:</span>
                    <span className="info-value">{getTimeSince(service.last_updated)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Mode:</span>
                    <span className="info-value">{service.mode}</span>
                  </div>
                </div>
                {!service.is_running && (
                  <div className="service-action-container">
                    <button 
                      className="resolve-service-button"
                      onClick={() => resolveService(key)}
                      disabled={resolvingAll}
                    >
                      {resolvingAll ? 'Resolving...' : 'Resolve'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="status-footer">
            <div className="status-timestamp">
              Last updated: {lastUpdated ? formatDate(lastUpdated.toISOString()) : 'Never'}
            </div>
            <div className="footer-buttons">
              <button 
                className="resolve-all-button"
                onClick={resolveAllServices}
                disabled={resolvingAll || !status || calculateSystemHealth().percentage === 100}
              >
                {resolvingAll ? 'Resolving All Services...' : 'Resolve All Services'}
              </button>
            </div>
          </div>
          
          {errorMessage && (
            <div className="error-message">
              {errorMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BackendStatusDashboard;