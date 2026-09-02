import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Without this, a render-time throw anywhere in the tree unmounts the whole app
 * and leaves a blank page with nothing to act on.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled error while rendering", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <section className="error-boundary" role="alert">
        <h2>Something went wrong</h2>
        <p>CivicLens hit an unexpected error. Reloading the page usually clears it.</p>

        <button type="button" onClick={() => globalThis.location.reload()}>
          Reload
        </button>
      </section>
    );
  }
}
