import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { Request, Response, NextFunction, Application } from 'express';
import path from 'path';
import fs from 'fs';
import express from 'express';

// Create default status files if they don't exist
const createDefaultStatusFile = (filename: string, content: any) => {
  const tradingDataDir = path.resolve(__dirname, '../trading_data');
  if (!fs.existsSync(tradingDataDir)) {
    fs.mkdirSync(tradingDataDir, { recursive: true });
  }
  const filePath = path.resolve(tradingDataDir, filename);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
    console.log(`Created default ${filename} at: ${filePath}`);
  }
};

// Create default status files
createDefaultStatusFile('backend_status.json', {
  status: 'offline',
  lastChecked: new Date().toISOString(),
  message: 'Backend is not currently running'
});

createDefaultStatusFile('live_trading_status.json', {
  status: 'offline',
  lastChecked: new Date().toISOString(),
  message: 'Live trading is not currently running'
});

createDefaultStatusFile('paper_trading_status.json', {
  is_running: false,
  last_updated: new Date().toISOString(),
  message: 'Paper trading server is not currently running'
});

// Setup proxy middleware
export const setupProxy = (app: Application) => {
  // Proxy API requests to the backend server
  app.use(
    '/trading',
    (req: Request, res: Response, next: NextFunction) => {
      console.log(`Proxying paper trading request: ${req.method} ${req.path}`);
      const paperTradingProxy = createProxyMiddleware({
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        secure: false,
        ws: true,
        headers: {
          Connection: 'keep-alive'
        },
        onError: (err: any, req: Request, res: Response) => {
          console.warn(`Paper trading proxy error: ${err.message}`);
          // Return a more helpful error for paper trading
          if (req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              status: 'success',
              data: {
                is_running: false,
                mode: 'paper',
                message: 'Paper trading server is not running. Please start it with: python paper_trading_api.py'
              }
            }));
          } else {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              status: 'error',
              message: 'Paper trading server is not running. Please start it with: python paper_trading_api.py'
            }));
          }
        }
      } as Options);
      return paperTradingProxy(req, res, next);
    }
  );

  // Default proxy for other trading endpoints
  app.use(
    '/api',
    (req: Request, res: Response, next: NextFunction) => {
      const proxy = createProxyMiddleware({
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        secure: false,
        onError: (err: any, req: Request, res: Response) => {
          console.warn(`Proxy error: ${err.message}`);
          res.writeHead(503, { 'Content-Type': 'text/plain' });
          res.end('Backend service unavailable');
        }
      } as Options);
      return proxy(req, res, next);
    }
  );

  // Serve trading data files
  app.use('/trading_data', (req: Request, res: Response, next: NextFunction) => {
    const tradingDataDir = path.resolve(__dirname, '../trading_data');
    const filePath = path.join(tradingDataDir, req.path);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).send('File not found');
    }
  });

  // Serve static files
  app.use(express.static(path.join(__dirname, '../public')));
};
