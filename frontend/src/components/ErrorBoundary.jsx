import React from 'react';
import { AlertOctagon, RefreshCw, Home } from 'lucide-react';

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
 }

 handleReset = () => {
 this.setState({ hasError: false, error: null });
 window.location.href = '/home';
 };

 handleReload = () => {
 window.location.reload();
 };

 render() {
 if (this.state.hasError) {
 return (
 <div className="min-h-screen bg-[var(--chassis)] flex items-center justify-center p-4">
 <div className="polysafe-card max-w-md w-full p-8 text-center space-y-5 rounded-[32px] shadow-[var(--shadow-card)]">
 <div className="w-16 h-16 rounded-full bg-[var(--chassis)] border-2 border-[var(--led-critical)]/30 flex items-center justify-center mx-auto shadow-sm">
 <AlertOctagon className="w-8 h-8 text-[var(--led-critical)]" />
 </div>

 <div className="space-y-1.5">
 <h2 className="text-2xl font-bold text-[var(--text-primary)]" >
 Something went wrong
 </h2>
 <p className="text-xs text-[var(--text-muted)] leading-relaxed">
 PolySafe encountered an unexpected issue while rendering this view.
 </p>
 </div>

 {this.state.error?.message && (
 <div className="p-3 bg-[var(--chassis)] shadow-[var(--shadow-card)] rounded-2xl text-[11px] font-mono text-[var(--led-critical)] text-left break-words overflow-auto max-h-28">
 {this.state.error.message}
 </div>
 )}

 <div className="flex gap-3 pt-2">
 <button
 type="button"
 onClick={this.handleReload}
 className="btn-secondary flex-1 py-3 text-xs flex items-center justify-center gap-2 cursor-pointer"
 >
 <RefreshCw className="w-4 h-4" />
 <span>Reload Page</span>
 </button>
 <button
 type="button"
 onClick={this.handleReset}
 className="btn-primary flex-1 py-3 text-xs flex items-center justify-center gap-2 cursor-pointer"
 >
 <Home className="w-4 h-4" />
 <span>Back to Home</span>
 </button>
 </div>
 </div>
 </div>
 );
 }

 return this.props.children;
 }
}
