import React from 'react';
import { AlertOctagon, RefreshCw, Sparkles } from 'lucide-react';
import { trackError } from '../utils/analytics';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[PolySafe ErrorBoundary Caught]:', error, errorInfo);
    trackError(error, 'react-error-boundary');
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleSwitchToGuest = () => {
    try {
      localStorage.removeItem('polysafe_token');
      localStorage.removeItem('polysafe_user');
      localStorage.removeItem('polysafe_role');
      localStorage.setItem('polysafe_is_guest', 'true');
    } catch (_e) {}
    this.setState({ hasError: false, error: null });
    window.location.href = '/home';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[var(--canvas)] flex items-center justify-center p-4">
          <div className="polysafe-card max-w-md w-full p-8 text-center space-y-6 rounded-[32px] shadow-[var(--shadow-card)] border border-[var(--border)]">
            <div className="w-16 h-16 rounded-full bg-[var(--canvas)] border-2 border-[var(--critical-fg)]/30 flex items-center justify-center mx-auto shadow-sm">
              <AlertOctagon className="w-8 h-8 text-[var(--critical-fg)]" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-[var(--ink)] font-[var(--font-heading)]">
                Clinical View Recovered
              </h2>
              <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                PolySafe safely caught an unexpected rendering event. All drug safety records remain fully secure in local memory.
              </p>
              {this.state.error && (
                <div className="text-left text-[11px] font-mono bg-red-500/10 text-red-500 p-2.5 rounded-xl max-h-36 overflow-auto border border-red-500/20">
                  <div className="font-bold">{this.state.error.name}: {this.state.error.message}</div>
                  <div className="text-[9px] opacity-75 mt-1 whitespace-pre-wrap">{this.state.error.stack}</div>
                </div>
              )}
            </div>

            <div className="p-3.5 bg-[var(--canvas)] border border-[var(--border)] rounded-2xl text-xs text-[var(--ink-3)] text-center leading-relaxed">
              You can instantly reload the view or switch to the self-contained offline Guest Demo.
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button
                type="button"
                onClick={this.handleReload}
                className="ps-btn ps-btn-secondary flex-1 py-3 text-xs flex items-center justify-center gap-2 cursor-pointer font-bold"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload</span>
              </button>
              <button
                type="button"
                onClick={this.handleSwitchToGuest}
                className="ps-btn ps-btn-primary flex-1 py-3 text-xs flex items-center justify-center gap-2 cursor-pointer font-bold"
              >
                <Sparkles className="w-4 h-4" />
                <span>Switch to Guest demo</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
