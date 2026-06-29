"use client";

import React from "react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  detailsOpen: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, detailsOpen: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, detailsOpen: false };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // Surface to console so platform monitoring can pick it up
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  private toggleDetails = () => {
    this.setState((prev) => ({ detailsOpen: !prev.detailsOpen }));
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        role="alert"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 24px",
          minHeight: 240,
        }}
      >
        <div
          className="card"
          style={{
            maxWidth: 480,
            width: "100%",
            padding: 24,
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>
            An unexpected error occurred
          </p>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
            The page encountered an error. Refreshing usually fixes this.
          </p>

          <button
            className="btn btn-primary btn-sm"
            style={{ marginBottom: 16 }}
            onClick={() => window.location.reload()}
          >
            Retry
          </button>

          <div style={{ textAlign: "left" }}>
            <button
              type="button"
              onClick={this.toggleDetails}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 12,
                color: "var(--text-muted)",
                padding: 0,
              }}
            >
              {this.state.detailsOpen ? "Hide" : "Show"} error details
            </button>
            {this.state.detailsOpen && this.state.error && (
              <pre
                style={{
                  marginTop: 8,
                  padding: 12,
                  background: "var(--bg-subtle)",
                  borderRadius: 6,
                  fontSize: 11,
                  overflowX: "auto",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  color: "var(--text-muted)",
                  border: "1px solid var(--border)",
                }}
              >
                {this.state.error.message}
                {"\n"}
                {this.state.error.stack}
              </pre>
            )}
          </div>
        </div>
      </div>
    );
  }
}
