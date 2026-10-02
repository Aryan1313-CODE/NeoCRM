import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(_error: unknown): ErrorBoundaryState {
    return { hasError: true };
  }
  componentDidCatch(error, info) { console.error("NeoCRM UI error", error, info); }
  render() {
    if (!this.state.hasError) return this.props.children;
    return <div className="center-page"><h1>Something went wrong</h1><p>The page could not be rendered safely.</p><button className="primary-btn" onClick={() => window.location.reload()}>Reload application</button></div>;
  }
}
