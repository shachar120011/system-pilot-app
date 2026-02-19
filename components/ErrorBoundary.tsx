import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center dir-rtl">
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-red-100 max-w-md w-full">
            <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
              <AlertTriangle size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">משהו השתבש</h1>
            <p className="text-slate-500 mb-6">
              האפליקציה נתקלה בשגיאה לא צפויה. אנחנו מתנצלים על אי הנוחות.
            </p>
            
            <div className="bg-slate-100 p-3 rounded-lg text-left text-xs text-slate-500 font-mono mb-6 overflow-auto max-h-32">
              {this.state.error?.message || "Unknown Error"}
            </div>

            <button
              onClick={this.handleReload}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-500/30 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCcw size={18} />
              רענן את העמוד
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}