import React from 'react';

interface State {
  hasError: boolean;
  error?: Error | null;
}

class RouteErrorBoundary extends React.Component<React.PropsWithChildren<{}>, State> {
  public props: React.PropsWithChildren<{}>;
  public state: State;

  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error('RouteErrorBoundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900">Something went wrong</h2>
          <p className="mt-2 text-slate-600">An unexpected error occurred while loading this page.</p>
          <pre className="mt-4 text-xs text-left max-w-xl mx-auto bg-slate-100 p-3 rounded">{String(this.state.error)}</pre>
        </div>
      );
    }

    return this.props.children as React.ReactElement;
  }
}

export default RouteErrorBoundary;
