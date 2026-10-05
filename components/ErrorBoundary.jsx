import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Unexpected UI error:', error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ maxWidth: 480, margin: '4rem auto', textAlign: 'center', padding: '0 1rem' }}>
          <p>Something went wrong on this page.</p>
          <button onClick={this.handleRetry}>Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}