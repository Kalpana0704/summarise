import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'Segoe UI, sans-serif', maxWidth: 600, margin: '0 auto' }}>
          <h1 style={{ color: '#3a3a8a' }}>Something went wrong</h1>
          <p style={{ color: '#666' }}>{this.state.error.message}</p>
          <ul style={{ color: '#888', fontSize: '0.9rem', marginTop: '1rem' }}>
            <li>Check that <code>client/.env</code> has all Firebase values filled in</li>
            <li>Restart the client: stop it (Ctrl+C) then run <code>npm run dev</code> again</li>
            <li>Make sure the server is also running on port 5000</li>
          </ul>
        </div>
      );
    }
    return this.props.children;
  }
}
