import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import httpProxyMiddleware from 'http-proxy-middleware';

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5173;  // Changed from 3001 to match Vite's default port

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve static files from dist directory
const DIST_DIR = path.join(__dirname, 'dist');
app.use(express.static(DIST_DIR));

// Proxy configuration
const proxyConfig = {
    '/trading/paper': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false
    },
    '/trading_data': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false
    }
};

// Apply proxy configuration
Object.entries(proxyConfig).forEach(([path, config]) => {
    app.all(path, (req, res) => {
        const proxy = httpProxyMiddleware(config);
        proxy(req, res, (err) => {
            if (err) {
                console.error(`Proxy error for ${path}:`, err);
                res.status(500).send('Proxy Error');
            }
        });
    });
});

// Serve logs
app.get('/logs', (req, res) => {
    const logDir = path.join(__dirname, '../backend/logs');
    
    // Get list of log files
    fs.readdir(logDir, (err, files) => {
        if (err) {
            console.error('Error reading logs directory:', err);
            res.status(500).json({ error: 'Failed to read logs directory' });
            return;
        }
        
        // Filter for log files
        const logFiles = files.filter(file => file.endsWith('.log') || file.endsWith('.txt'));
        
        // Get content of each log file
        const logContents = [];
        
        logFiles.forEach(file => {
            const filePath = path.join(logDir, file);
            fs.readFile(filePath, 'utf8', (err, content) => {
                if (err) {
                    console.error(`Error reading ${file}:`, err);
                    return;
                }
                logContents.push({
                    filename: file,
                    content: content
                });
                
                // If this is the last file, send response
                if (logContents.length === logFiles.length) {
                    res.json(logContents);
                }
            });
        });
    });
});

// Serve status files
app.get('/trading_data/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(DIST_DIR, 'trading_data', filename);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'Status file not found' });
    return;
  }
  
  res.sendFile(filePath);
});

// Path to trading config file
const CONFIG_FILE_PATH = path.join(DIST_DIR, 'trading_data', 'trading_config.json');

// Endpoint to update trading configuration
app.post('/api/update-trading-config', (req, res) => {
  const { config } = req.body;
  
  try {
    // Save the config to file
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2));
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving config:', error);
    res.status(500).json({ error: 'Failed to save configuration' });
  }
});

// Serve the frontend app
app.get('*', (req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Frontend server running on port ${PORT}`);
});
