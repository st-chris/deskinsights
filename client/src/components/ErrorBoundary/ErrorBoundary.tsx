import React, { type ReactNode } from 'react';
import logger from '../../services/logger';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('React Error Boundary caught:', error);
    logger.error('Component stack:', errorInfo.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className='flex items-center justify-center min-h-screen bg-slate-50'>
          <div className='w-full max-w-md mx-auto px-4'>
            <div className='rounded-lg border border-red-200 bg-red-50 p-8'>
              <div className='flex items-center gap-3 mb-4'>
                <AlertCircle className='h-6 w-6 text-red-600' />
                <h1 className='text-lg font-semibold text-red-900'>
                  Oops! Something went wrong
                </h1>
              </div>

              <p className='text-sm text-red-800 mb-6'>
                We encountered an unexpected error. Please try refreshing the
                page, or go back to the home page.
              </p>

              {import.meta.env.DEV && this.state.error && (
                <details className='mb-6 text-xs text-red-700'>
                  <summary className='cursor-pointer font-medium mb-2'>
                    Error Details (Dev Only)
                  </summary>
                  <pre className='bg-red-100 p-3 rounded overflow-auto max-h-48'>
                    {this.state.error.toString()}
                    {'\n\n'}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}

              <div className='flex gap-3'>
                <button
                  onClick={this.handleReset}
                  className='flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition'
                >
                  Try Again
                </button>
                <button
                  onClick={() => (window.location.href = '/')}
                  className='flex-1 px-4 py-2 border border-red-200 text-red-700 rounded-lg font-medium hover:bg-red-100 transition'
                >
                  Go Home
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
