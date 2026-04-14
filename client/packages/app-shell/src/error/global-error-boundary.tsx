import { Component, type ErrorInfo, type ReactNode } from 'react';
import { GlobalErrorPage } from './global-error-page';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}
interface State {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[GlobalErrorBoundary]', error, errorInfo);
  }

  override render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <GlobalErrorPage error={this.state.error} />;
    }
    return this.props.children;
  }
}
