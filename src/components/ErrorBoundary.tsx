import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

const serializeError = (error: any): string => {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}\n\nStack trace:\n${error.stack || 'No stack trace available'}`;
  }
  if (typeof error === 'object' && error !== null) {
    try {
      return JSON.stringify(error, null, 2);
    } catch {
      return '[Complex Error Object - Cannot Serialize]';
    }
  }
  return String(error || 'Unknown error');
};

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: any; retry: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
  errorId: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorId: Date.now().toString(36)
    };
  }

  static getDerivedStateFromError(error: any): Partial<ErrorBoundaryState> {
    return { 
      hasError: true, 
      error,
      errorId: Date.now().toString(36)
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for debugging
    console.group('🚨 Error Boundary Caught Error');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Report to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      // Add error reporting service here
      console.warn('Production error reporting not configured');
    }
  }

  handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      console.log(`🔄 Error Boundary Retry Attempt ${this.retryCount}/${this.maxRetries}`);
      this.setState({ hasError: false, error: null, errorId: Date.now().toString(36) });
    } else {
      console.warn('⚠️ Max retry attempts reached, manual intervention required');
      // Force page reload as last resort
      window.location.reload();
    }
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} retry={this.handleRetry} />;
      }

      const isInfiniteLoop = this.state.error?.message?.includes('Maximum update depth exceeded');
      const isNavigationError = this.state.error?.message?.includes('navigate') || 
                               this.state.error?.message?.includes('router');

      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
              <div className="text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {isInfiniteLoop ? 'System Stability Error' : 
                   isNavigationError ? 'Navigation Error' : 
                   'Something went wrong'}
                </h2>
                <p className="text-sm text-gray-600 mb-6">
                  {isInfiniteLoop ? 'The application encountered a rendering loop. This has been automatically contained.' :
                   isNavigationError ? 'There was an issue with page navigation. You can safely continue using the application.' :
                   'An unexpected error occurred, but the system remains stable.'}
                </p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={this.handleRetry}
                  disabled={this.retryCount >= this.maxRetries}
                  className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {this.retryCount >= this.maxRetries ? 'Max Retries Reached' : `Try Again (${this.retryCount}/${this.maxRetries})`}
                </button>

                <button
                  onClick={this.handleGoHome}
                  className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </button>
              </div>

              {process.env.NODE_ENV === 'development' && (
                <details className="mt-6">
                  <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                    Error Details (Development Only)
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-40">
                    <div className="text-red-600 font-semibold mb-2">Error ID: {this.state.errorId}</div>
                    <pre className="whitespace-pre-wrap">{serializeError(this.state.error)}</pre>
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}