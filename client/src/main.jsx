import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './AuthContext';
import { ToastProvider } from './components/ui';
import './index.css';

class Boundary extends React.Component {
  state = { err: null };
  static getDerivedStateFromError(err) { return { err }; }
  render() {
    if (!this.state.err) return this.props.children;
    return <pre style={{ padding: 24, whiteSpace: 'pre-wrap', color: '#B42318' }}>{String(this.state.err.stack || this.state.err)}</pre>;
  }
}
createRoot(document.getElementById('root')).render(
  <Boundary><BrowserRouter><AuthProvider><ToastProvider><App /></ToastProvider></AuthProvider></BrowserRouter></Boundary>
);
