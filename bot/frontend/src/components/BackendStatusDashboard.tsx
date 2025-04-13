import React, { useState, useEffect, useCallback } from 'react';
import './BackendStatusDashboard.css';
import { motion } from 'framer-motion';

interface ServiceStatus {
  name: string;
  status: string;
  pid: number | null;
  trading_active?: boolean;
  managed_by_systemd?: boolean;
  dependencies?: string[];
}

interface LogStatus {
  path: string;
  last_modified: string;
}

interface BackendStatus {
  timestamp: string;
  services: {
    systemd: ServiceStatus;
    backend: ServiceStatus;
    signals: ServiceStatus;
    paper_trading: ServiceStatus;
    database: ServiceStatus;
    frontend: ServiceStatus;
  };
  logs: {
    backend: LogStatus;
    signals: LogStatus;
    paper_trading: LogStatus;
  };
  error?: string;
}

const SERVICE_DEPENDENCIES = {
  'frontend': ['backend'],
  'backend': ['database', 'signals'],
  'paper_trading': ['backend', 'database'],
  'signals': ['backend']
};

const BackendStatusDashboard: React.FC = () => {
  const [status, setStatus] = useState<BackendStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [resolvingService, setResolvingService] = useState<string | null>(null);
  const [resolvingAll, setResolvingAll] = useState<boolean>(false);
  
  // Fallback status data for when the backend is unreachable
  const generateFallbackStatus = (): BackendStatus => {
    const timestamp = new Date().toISOString();
    const fallbackData: BackendStatus = {
      timestamp,
      services: {
        systemd: {
          name: 'System Daemon',
          status: 'unknown',
          pid: null,
          managed_by_systemd: true
        },
        backend: {
          name: 'Trading Engine',
          status: 'unknown',
          pid: null
        },
        signals: {
          name: 'Signal Generator',
          status: 'unknown',
          pid: null
        },
        paper_trading: {
          name: 'Paper Trading',
          status: 'unknown',
          pid: null,
          trading_active: false
        },
        database: {
          name: 'Database',
          status: 'unknown',
          pid: null
        },
        frontend: {
          name: 'Web Interface',
          status: 'active', // Frontend is working if we're seeing this
          pid: null
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
    };
    return fallbackData;
  };
  
  // Check service status using standardized endpoint
  const checkServiceStatus = useCallback(async (service: string) => {
    try {
      const response = await fetch(`/api/status/${service}`);
      if (!response.ok) {
        throw new Error(`Service ${service} returned status ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error checking ${service} status:`, error);
      return { status: 'unknown', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, []);

  // Attempt to ping each service to determine availability
  const checkServiceAvailability = useCallback(async () => {
    try {
      // Check all services in parallel
      const [backendStatus, signalsStatus, paperTradingStatus, databaseStatus] = await Promise.all([
        checkServiceStatus('backend'),
        checkServiceStatus('signals'),
        checkServiceStatus('paper_trading'),
        checkServiceStatus('database')
      ]);

      const currentStatus = generateFallbackStatus();
      currentStatus.timestamp = new Date().toISOString();
      
      // Update service statuses
      (currentStatus.services as Record<string, ServiceStatus>).backend.status = backendStatus.status;
      (currentStatus.services as Record<string, ServiceStatus>).signals.status = signalsStatus.status;
      (currentStatus.services as Record<string, ServiceStatus>).paper_trading.status = paperTradingStatus.status;
      (currentStatus.services as Record<string, ServiceStatus>).paper_trading.trading_active = paperTradingStatus.is_running;
      (currentStatus.services as Record<string, ServiceStatus>).database.status = databaseStatus.status;
      
      // Update logs
      const [backendLog, signalsLog, paperTradingLog] = await Promise.all([
        checkServiceStatus('backend-log'),
        checkServiceStatus('signals-log'),
        checkServiceStatus('paper_trading-log')
      ]);
      
      currentStatus.logs.backend.last_modified = backendLog.last_modified || currentStatus.timestamp;
      currentStatus.logs.signals.last_modified = signalsLog.last_modified || currentStatus.timestamp;
      currentStatus.logs.paper_trading.last_modified = paperTradingLog.last_modified || currentStatus.timestamp;
      
      setStatus(currentStatus);
      setErrorMessage(null);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error checking service availability:', error);
      setErrorMessage('Error connecting to backend services');
    }
  }, [checkServiceStatus]);

  // Keep track of manually resolved services to prevent them from being marked as inactive on refresh
  const [resolvedServices, setResolvedServices] = useState<string[]>([]);

  // Function to fetch backend status
  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      
      // Try to fetch the backend status file through the proxy
      try {
        const response = await fetch('/trading/paper');
        
        if (response.ok) {
          const data = await response.json();
          
          // Apply our manually resolved services to the fetched data
          if (resolvedServices.length > 0) {
            resolvedServices.forEach(serviceKey => {
              if (data.services && serviceKey in data.services) {
                (data.services as Record<string, ServiceStatus>)[serviceKey].status = 'active';
              }
            });
          }
          
          setStatus(data);
          setLastUpdated(new Date());
          setErrorMessage(null);
          return;
        }
      } catch (error) {
        console.warn('Backend status file unavailable, checking services directly...', error);
      }
      
      // If the status file isn't available, check services directly
      const serviceStatus = await checkServiceAvailability();
      
      // Apply our manually resolved services to the direct check results
      if (resolvedServices.length > 0) {
        resolvedServices.forEach(serviceKey => {
          if (serviceKey in serviceStatus.services) {
            (serviceStatus.services as Record<string, ServiceStatus>)[serviceKey].status = 'active';
          }
        });
      }
      
      setStatus(serviceStatus);
      setLastUpdated(new Date());
      setErrorMessage(null);
      
    } catch (err) {
      console.error('Failed to assess backend status:', err);
      // Still show what we can
      const fallbackStatus = generateFallbackStatus();
      
      // Apply our manually resolved services to the fallback status
      if (resolvedServices.length > 0) {
        resolvedServices.forEach(serviceKey => {
          if (serviceKey in fallbackStatus.services) {
            (fallbackStatus.services as Record<string, ServiceStatus>)[serviceKey].status = 'active';
          }
        });
      }
      
      setStatus(fallbackStatus);
      setLastUpdated(new Date());
      setErrorMessage(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [resolvedServices, checkServiceAvailability]);

  // Poll for status updates
  useEffect(() => {
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Format date for display
  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString();
    } catch {
      return 'Unknown';
    }
  };

  // Calculate time since last update
  const getTimeSince = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins === 1) return '1 minute ago';
      if (diffMins < 60) return `${diffMins} minutes ago`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours === 1) return '1 hour ago';
      if (diffHours < 24) return `${diffHours} hours ago`;
      
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return '1 day ago';
      return `${diffDays} days ago`;
    } catch {
      return 'Unknown';
    }
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'running':
      case 'active':
        return 'status-running';
      case 'stopped':
      case 'inactive':
        return 'status-stopped';
      case 'unreachable':
        return 'status-unreachable';
      case 'unknown':
        return 'status-unknown';
      default:
        return 'status-unknown';
    }
  };
  
  // Get a descriptive status message
  const getStatusMessage = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'running':
      case 'active':
        return 'Operational';
      case 'stopped':
      case 'inactive':
        return 'Stopped';
      case 'unreachable':
        return 'Unreachable';
      case 'unknown':
        return 'Status Unknown';
      default:
        return 'Status Unknown';
    }
  };

  // Calculate service positions for dependency visualization
  const calculateServicePositions = useCallback((services: Record<string, ServiceStatus>) => {
    const positions: Record<string, { x: number; y: number }> = {};
    const layers: string[][] = [];
    const usedServices = new Set<string>();

    // First layer: independent services
    layers.push(['systemd']);
    usedServices.add('systemd');

    // Second layer: backend and database
    layers.push(['database', 'backend']);
    usedServices.add('database');
    usedServices.add('backend');

    // Third layer: dependent services
    const thirdLayer = ['signals', 'paper_trading'];
    layers.push(thirdLayer);
    thirdLayer.forEach(svc => usedServices.add(svc));

    // Fourth layer: frontend
    layers.push(['frontend']);
    usedServices.add('frontend');

    // Calculate positions
    const totalWidth = 1000;
    const totalHeight = 600;
    const padding = 50;
    const layerSpacing = 100;
    const nodeWidth = 100;
    const nodeHeight = 100;

    layers.forEach((layer, layerIndex) => {
      const layerX = padding + (layerIndex * layerSpacing);
      const layerY = (totalHeight - nodeHeight) / 2;
      
      layer.forEach((service, index) => {
        const serviceY = layerY + (index * (nodeHeight + 20));
        positions[service] = {
          x: layerX,
          y: serviceY
        };
      });
    });

    return positions;
  }, []);

  // Render dependency visualization
  const renderDependencyGraph = useCallback((services: Record<string, ServiceStatus>) => {
    const positions = calculateServicePositions(services);
    
    // Render dependency lines
    const dependencyLines = Object.entries(SERVICE_DEPENDENCIES).flatMap(([service, dependencies]) => {
      return dependencies.map((dep) => {
        const fromPos = positions[service];
        const toPos = positions[dep];
        
        if (!fromPos || !toPos) return null;
        
        const x1 = fromPos.x + 50;
        const y1 = fromPos.y + 50;
        const x2 = toPos.x + 50;
        const y2 = toPos.y + 50;
        
        return (
          <>
            <line
              key={`${service}-${dep}-line`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              className="dependency-line"
            />
            <g key={`${service}-${dep}-arrow`}>
              <line
                x1={x2}
                y1={y2}
                x2={x2 - 10}
                y2={y2 - 10}
                className="dependency-arrow"
              />
              <line
                x1={x2}
                y1={y2}
                x2={x2 - 10}
                y2={y2 + 10}
                className="dependency-arrow"
              />
            </g>
          </>
        );
      });
    });

    // Render service nodes
    const serviceNodes = Object.entries(services).map(([key, service]) => {
      const pos = positions[key];
      if (!pos) return null;

      const statusColor = getStatusColor(service.status);
      
      return (
        <g key={key} className="dependency-node">
          <rect
            x={pos.x}
            y={pos.y}
            width={100}
            height={100}
            fill="white"
            stroke={statusColor}
            strokeWidth={2}
            rx={8}
          />
          <text
            x={pos.x + 50}
            y={pos.y + 50}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={statusColor}
            fontSize={14}
          >
            {service.name}
          </text>
          <circle
            cx={pos.x + 10}
            cy={pos.y + 10}
            r={5}
            fill={statusColor}
          />
        </g>
      );
    });

    return (
      <svg className="dependency-graph" viewBox={`0 0 1200 600`}>
        {dependencyLines}
        {serviceNodes}
      </svg>
    );
  }, [calculateServicePositions]);

  // Calculate health percentage
  const calculateHealth = useCallback((services: Record<string, ServiceStatus>) => {
    const totalServices = Object.keys(services).length;
    let activeServices = 0;
    
    Object.values(services).forEach(service => {
      if (service.status === 'active' || service.status === 'running') {
        activeServices++;
      }
    });
    
    const percentage = (activeServices / totalServices) * 100;
    
    let label = 'Healthy';
    if (percentage < 100) label = 'Degraded';
    if (percentage < 75) label = 'Critical';
    
    return { percentage, label };
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchStatus();
    
    // Setup refresh interval if auto-refresh is enabled
    if (autoRefresh) {
      const intervalId = setInterval(fetchStatus, 30000); // Refresh every 30 seconds
      return () => clearInterval(intervalId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, fetchStatus]);

  // Function to attempt to resolve a specific service issue
  const resolveService = async (service: string) => {
    try {
      setResolvingService(service);
      
      // Get service dependencies
      const dependencies = SERVICE_DEPENDENCIES[service] || [];
      
      // First try to resolve any failed dependencies
      for (const dep of dependencies) {
        const depStatus = status?.services[dep];
        if (depStatus && !['active', 'running'].includes(depStatus.status.toLowerCase())) {
          await resolveService(dep);
        }
      }
      
      // Then try to resolve the service itself
      const response = await fetch(`/api/status/${service}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `Failed to resolve ${service}`);
      }
      
      // Update status immediately
      setStatus(prev => {
        if (!prev) return prev;
        const newServices = { ...prev.services };
        newServices[service].status = 'active';
        return { ...prev, services: newServices };
      });
      
      // Schedule a full status refresh after 2 seconds
      setTimeout(() => fetchStatus(), 2000);
      
    } catch (error) {
      console.error(`Error resolving ${service}:`, error);
      setStatus(prev => {
        if (!prev) return prev;
        const newServices = { ...prev.services };
        newServices[service].status = 'error';
        return { ...prev, services: newServices };
      });
    } finally {
      setResolvingService(null);
    }
  };

  // Function to attempt to resolve all backend issues
  const resolveAllServices = async () => {
    try {
      setResolvingAll(true);
      
      // Resolve services in dependency order
      const services = Object.entries(status?.services || {});
      
      // Sort services by dependency depth (services with more dependencies first)
      const sortedServices = services.sort((a, b) => {
        const aDeps = SERVICE_DEPENDENCIES[a[0]]?.length || 0;
        const bDeps = SERVICE_DEPENDENCIES[b[0]]?.length || 0;
        return bDeps - aDeps;
      });
      
      // Resolve each service that needs it
      for (const [service] of sortedServices) {
        const serviceStatus = status?.services[service];
        if (serviceStatus && !['active', 'running'].includes(serviceStatus.status.toLowerCase())) {
          await resolveService(service);
        }
      }
      
      // Force a full status refresh
      await fetchStatus();
      
    } catch (error) {
      console.error('Error resolving all services:', error);
      setErrorMessage('Failed to resolve all services');
    } finally {
      setResolvingAll(false);
    }
  };
  
  // Show error message if there is one
  const showError = errorMessage && !loading ? (
    <div className="backend-status-error">{errorMessage}</div>
  ) : null;
  
  // Always render the component, even if loading or error
  // This provides a better user experience than showing an error message

  return (
    <div className="status-container">
      <div className="dependency-container">
        {status && renderDependencyGraph(status.services)}
      </div>

      {status && (
        <div className="health-meter-container">
          <div className="health-meter">
            <motion.div 
              className="health-bar"
              style={{ width: `${calculateHealth(status.services).percentage}%` }}
              animate={{ width: `${calculateHealth(status.services).percentage}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="health-label">
            {calculateHealth(status.services).label} ({calculateHealth(status.services).percentage}%)
          </div>
        </div>
      )}

      <div className="service-grid">
        {status && Object.entries(status.services).map(([key, service]) => (
          <motion.div
            key={key}
            className="service-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="service-header">
              <div className={`status-indicator ${getStatusColor(service.status)}`} />
              <span className="service-name">{service.name}</span>
            </div>

            <div className="service-details">
              {service.pid && (
                <div className="service-detail">
                  <span className="detail-label">PID:</span>
                  <span className="detail-value">{service.pid}</span>
                </div>
              )}
              {key === 'backend' && service.managed_by_systemd && (
                <div className="service-detail">
                  <span className="detail-label">Managed by:</span>
                  <span className="detail-value systemd-managed">systemd</span>
                </div>
              )}
              {key === 'paper_trading' && service.trading_active !== undefined && (
                <div className="service-detail">
                  <span className="detail-label">Trading:</span>
                  <span className={`detail-value ${service.trading_active ? 'active-trading' : 'inactive-trading'}`}>
                    {service.trading_active ? 'Active' : 'Paused'}
                  </span>
                </div>
              )}
              {service.dependencies && service.dependencies.length > 0 && (
                <div className="service-detail">
                  <span className="detail-label">Dependencies:</span>
                  <span className="detail-value">
                    {service.dependencies.join(', ')}
                  </span>
                </div>
              )}
            </div>

            {service.status.toLowerCase() !== 'active' && service.status.toLowerCase() !== 'running' && (
              <div className="service-action-container">
                <button 
                  className="resolve-service-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    resolveService(key);
                  }}
                  disabled={resolvingService === key || resolvingAll}
                >
                  {resolvingService === key ? (
                    <span className="spinner-small"></span>
                  ) : (
                    'Resolve'
                  )}
                </button>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="logs-section">
        <h4>Log Files</h4>
        <div className="logs-grid">
          {status && Object.entries(status.logs).map(([key, log]) => (
            <div key={key} className="log-card">
              <div className="log-header">
                <h5>{key.charAt(0).toUpperCase() + key.slice(1)} Log</h5>
              </div>
              <div className="log-details">
                <div className="log-detail">
                  <span className="detail-label">Last Updated:</span>
                  <span className="detail-value">{getTimeSince(log.last_modified)}</span>
                </div>
                <div className="log-detail">
                  <span className="detail-label">Path:</span>
                  <span className="detail-value log-path">{log.path}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="status-footer">
        <div className="status-timestamp">
          Status generated: {status ? formatDate(status.timestamp) : 'Unknown'}
        </div>
        <div className="footer-buttons">
          <button 
            className="resolve-all-button"
            onClick={resolveAllServices}
            disabled={resolvingAll || !status || calculateHealth(status.services).percentage === 100}
          >
            {resolvingAll ? (
              <>
                <span className="spinner-small"></span> Resolving Issues...
              </>
            ) : (
              'Resolve Backend Issues'
            )}
          </button>
          <button className="view-logs-button" onClick={() => window.open('/logs', '_blank')}>
            View Full Logs
          </button>
        </div>
      </div>
    </div>
  );
};

export default BackendStatusDashboard;
