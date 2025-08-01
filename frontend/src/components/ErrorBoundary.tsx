import React, { Component } from 'react';

class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red' }}>
          <h2>Something went wrong:</h2>
          <pre>{this.state.error?.message}</pre>
          <p>Please check the browser console for more details.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
