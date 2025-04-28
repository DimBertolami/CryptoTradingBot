// @ts-nocheck
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const fs = require('fs');

/**
 * @param {import('express').Express} app
 */
module.exports = function(app) {
  // Create trading_data directory if it doesn't exist
  const tradingDataDir = path.resolve(__dirname, '../trading_data');
  if (!fs.existsSync(tradingDataDir)) {
    fs.mkdirSync(tradingDataDir, { recursive: true });
    console.log(`Created trading_data directory at: ${tradingDataDir}`);
  }
  
  // Create default status files if they don't exist
  /**
 * @param {string} filename
 * @param {any} content
 */
const createDefaultStatusFile = (filename, content) => {
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
    message: 'Paper trading is not currently running'
  });
  
  // Proxy API requests to the backend server
  app.use(
    '/trading',
    /**
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    (req, res, next) => {
      try {
        // Special handling for paper trading endpoints
        if (req.path === '/paper' || req.path.startsWith('/paper/')) {
          console.log(`Proxying paper trading request: ${req.method} ${req.path}`);
          const paperTradingProxy = createProxyMiddleware({
            target: 'http://localhost:5001',
            changeOrigin: true,
            // Don't rewrite the path - keep it as is
            // pathRewrite: { '^/trading/paper': '/trading/paper' },
            
          });
          return paperTradingProxy(req, res, next);
        }
        
        // Default proxy for other trading endpoints
        const proxy = createProxyMiddleware({
          target: 'http://localhost:5001',
          changeOrigin: true,
          
        });
        return proxy(req, res, next);
      } catch (error) {
        console.warn(`Proxy setup error: ${typeof error === 'object' && error && 'message' in error ? error.message : String(error)}`);
        res.status(503).send('Backend service unavailable');
      }
    }
  );
  
  // Serve trading data files (status files, etc.)
  // Global proxy error handler
/**
 * Global proxy error handler
 * @param {any} err
 * @param {import('express').Request} _req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
app.use((err, _req, res, next) => {
  if (err && err.code === 'ECONNREFUSED') {
    res.status(503).json({
      status: 'error',
      message: 'Backend service unavailable',
    });
  } else {
    next(err);
  }
});

app.use('/trading_data', (req, res, next) => {
    if (req.path === '/paper_trading_status.json') {
      // Check multiple possible locations for the paper trading status file
      const possiblePaths = [
        path.resolve(__dirname, '../trading_data/paper_trading_status.json'),
        path.resolve(__dirname, '../../paper_trading_state.json'),
        path.resolve(__dirname, '../../backend/paper_trading_state.json')
      ];
      
      // Try each path until we find the file
      for (const filePath of possiblePaths) {
        if (fs.existsSync(filePath)) {
          console.log(`Serving paper trading status from: ${filePath}`);
          return res.sendFile(filePath);
        }
      }
      
      // If no file is found, serve the default one we created
      const defaultPath = path.resolve(tradingDataDir, 'paper_trading_status.json');
      console.log(`Serving default paper trading status from: ${defaultPath}`);
      return res.sendFile(defaultPath);
    } else if (req.path === '/backend_status.json' || req.path === '/live_trading_status.json') {
      // Check for status file
      const statusPath = path.resolve(tradingDataDir, req.path);
      
      if (fs.existsSync(statusPath)) {
        console.log(`Serving status from: ${statusPath}`);
        return res.sendFile(statusPath);
      }
      
      // If no file is found, serve the default file we created earlier
      const defaultPath = path.resolve(tradingDataDir, req.path.substring(1));
      if (fs.existsSync(defaultPath)) {
        console.log(`Serving default status from: ${defaultPath}`);
        return res.sendFile(defaultPath);
      }
      
      // Create a default status file on the fly if it doesn't exist
      const defaultContent = {
        status: 'offline',
        lastChecked: new Date().toISOString(),
        message: `${req.path.replace('.json', '').replace('/', '').replace('_', ' ')} is not currently running`
      };
      
      fs.writeFileSync(defaultPath, JSON.stringify(defaultContent, null, 2));
      console.log(`Created and serving new default status file: ${defaultPath}`);
      return res.json(defaultContent);
    }
    next();
  });
};
