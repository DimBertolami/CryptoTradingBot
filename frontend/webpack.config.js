const path = require('path');

module.exports = {
  resolve: {
    modules: [path.resolve(__dirname, 'src'), 'node_modules'],
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@mui': path.resolve(__dirname, 'node_modules/@mui'),
      'react-router-dom': path.resolve(__dirname, 'node_modules/react-router-dom'),
      '@tanstack/react-query': path.resolve(__dirname, 'node_modules/@tanstack/react-query'),
      'react-redux': path.resolve(__dirname, 'node_modules/react-redux')
    }
  }
};
