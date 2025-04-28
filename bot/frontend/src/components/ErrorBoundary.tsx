import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error | null;
  errorInfo?: React.ErrorInfo | null;
}

class ErrorBoundary extends React.Component<React.PropsWithChildren<object>, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren<object>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to external service if needed
    this.setState({ error, errorInfo });
    // Optionally: send error to remote logging service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32, textAlign: 'center' }}>
          <h1>Something went wrong.</h1>
          <pre style={{ color: 'red', marginTop: 16 }}>
            {this.state.error?.toString()}
          </pre>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: 16 }}>
            {this.state.errorInfo?.componentStack}
          </details>
          <button style={{ marginTop: 24 }} onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
