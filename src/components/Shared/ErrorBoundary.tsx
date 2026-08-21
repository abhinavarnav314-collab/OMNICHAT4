import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-xl max-w-md w-full text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center">
              <AlertTriangle size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                An unexpected error occurred in the application.
              </p>
              {this.state.error && (
                <div className="text-left bg-slate-100 dark:bg-slate-900 p-3 rounded-lg text-xs font-mono text-slate-600 dark:text-slate-400 overflow-x-auto max-h-32 mb-4">
                  {this.state.error.message}
                </div>
              )}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-[var(--accent-color)] hover:bg-[var(--accent-color)] text-white rounded-lg font-medium transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
