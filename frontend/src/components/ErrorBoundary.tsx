import React, { Component } from 'react';
import { Alert, Box } from '@mui/material';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3 }}>
          <Alert severity="error">
            <strong>Something went wrong:</strong> {this.state.error?.message}
          </Alert>
          {this.props.fallback || null}
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
