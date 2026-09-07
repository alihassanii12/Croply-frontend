"use client";

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to console in development only
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-900 p-4">
          <div className="max-w-md w-full text-center">
            <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-lg p-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Something went wrong
              </h2>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
                We're sorry, but something unexpected happened. Please try refreshing the page.
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Page
                </button>
                
                <button
                  onClick={() => this.setState({ hasError: false })}
                  className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-gray-700 dark:text-gray-300 font-medium py-2.5 px-4 rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                    Error Details (Development Only)
                  </summary>
                  <pre className="mt-2 text-xs text-red-600 bg-red-50 dark:bg-red-900/10 p-2 rounded overflow-auto max-h-32">
                    {this.state.error.message}
                    {'\n'}
                    {this.state.error.stack}
                  </pre>
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

export default ErrorBoundary;