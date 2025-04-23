export interface StatusResponse {
  is_running: boolean;
  status: 'active' | 'inactive' | 'error' | 'unknown';
  mode: string;
  last_updated: string;
  details?: {
    balance?: number;
    holdings?: Record<string, number>;
    metrics?: Record<string, number>;
  };
}

export interface StatusRequest {
  service: 'backend' | 'signals' | 'paper_trading' | 'database';
}

export interface StatusError {
  error: string;
  message: string;
}
