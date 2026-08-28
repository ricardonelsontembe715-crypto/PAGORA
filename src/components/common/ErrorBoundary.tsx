import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';
import { Button } from '../ui/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Registo seguro de auditoria de erro interno (sem expor ao utilizador final)
    console.error('[PAGORA AUDIT] Erro não tratado interceptado pelo ErrorBoundary:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 bg-[#F8FAFC]">
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>

            <h2 className="text-lg font-bold text-slate-900 mb-2">
              Não foi possível concluir esta operação
            </h2>

            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              Ocorreu uma inconsistência temporária na apresentação desta secção. Os seus dados e cobranças continuam em total segurança.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                variant="primary"
                size="sm"
                onClick={this.handleRetry}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                className="w-full sm:w-auto"
              >
                Tentar novamente
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={this.handleGoHome}
                leftIcon={<Home className="w-3.5 h-3.5" />}
                className="w-full sm:w-auto"
              >
                Página inicial
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
