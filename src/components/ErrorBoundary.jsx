import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="card panel-surface" style={{ padding: '24px', border: '1px solid rgba(255, 42, 109, 0.5)' }}>
          <h3 style={{ color: 'var(--accent-tertiary)', margin: '0 0 10px', fontSize: '1.2rem', fontWeight: 800 }}>⚠ Component Crashed</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            The application caught an unexpected rendering error in this widget (Likely undefined property access). 
            The rest of the dashboard remains operational due to Error Boundary isolation.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
