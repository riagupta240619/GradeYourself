import React, { Component, type ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught a runtime exception:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 rounded-2xl border border-rose-500/20 bg-rose-950/10 text-center space-y-4 my-4">
          <div className="w-12 h-12 mx-auto rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {this.props.fallbackTitle || "Component Failed to Render"}
            </h3>
            <p className="text-xs text-rose-300 max-w-md mx-auto mt-1 font-mono">
              {this.state.error?.message || "An unexpected rendering error occurred."}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="border-rose-500/30 text-rose-300 hover:bg-rose-500/10 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry Component Render
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
