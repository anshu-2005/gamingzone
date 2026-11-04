import React from 'react';

/**
 * Production Gaming Error Boundary
 * Catches runtime crashes, corrupt storage states, or WebGL failures gracefully
 * without tearing down the entire app.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('GamingZone Caught UI Exception:', error, errorInfo);
    this.setState({ errorInfo });
    // Track error event in GA if available
    if (typeof window.trackGameEvent === 'function') {
      window.trackGameEvent('ui_exception', {
        message: error?.message || 'unknown',
        source: this.props.context || 'global'
      });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.hash = '#home';
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            minHeight: this.props.isGameArea ? '450px' : '70vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle at 50% 40%, #0f172a 0%, #030712 100%)',
            color: '#f8fafc',
            padding: '32px 20px',
            textAlign: 'center',
            borderRadius: '16px',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
            margin: '20px auto',
            maxWidth: '720px'
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>⚠️</div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f87171', margin: '0 0 8px' }}>
            {this.props.isGameArea ? 'Game Encountered an Issue' : 'Something went wrong'}
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.92rem', maxWidth: '480px', margin: '0 0 20px', lineHeight: 1.5 }}>
            {this.props.isGameArea
              ? 'This game session stopped responding. Your high scores and coins remain safe in your player profile.'
              : 'GamingZone caught an unexpected rendering state. Click below to restore your session.'}
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={this.handleReset}
              style={{
                background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                color: '#fff',
                border: 'none',
                padding: '10px 22px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(56, 189, 248, 0.4)'
              }}
            >
              🔄 Reload &amp; Try Again
            </button>
            <a
              href="#home"
              onClick={() => {
                this.setState({ hasError: false });
                if (this.props.onHome) this.props.onHome();
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#cbd5e1',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                padding: '10px 22px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.9rem',
                textDecoration: 'none',
                cursor: 'pointer'
              }}
            >
              🎮 Browse Other Games
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
