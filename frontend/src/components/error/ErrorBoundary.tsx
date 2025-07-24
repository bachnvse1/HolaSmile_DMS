import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  private handleRefresh = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
          <Card className="w-full max-w-3xl shadow-2xl">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <div className="flex justify-center mb-4">
                  <AlertTriangle className="h-20 w-20 text-red-600" />
                </div>
                <h1 className="text-4xl font-bold text-gray-800 mb-4">
                  Đã xảy ra lỗi
                </h1>
                <p className="text-lg text-gray-600 mb-2">
                  Ứng dụng đã gặp phải lỗi không mong muốn.
                </p>
                <p className="text-gray-500">
                  Chúng tôi xin lỗi vì sự bất tiện này và đang nỗ lực khắc phục.
                </p>
              </div>

              {/* Error Details */}
              {this.state.error && (
                <div className="mb-6">
                  <details className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <summary className="cursor-pointer text-red-800 font-medium flex items-center gap-2">
                      <Bug className="h-4 w-4" />
                      Chi tiết lỗi (dành cho nhà phát triển)
                    </summary>
                    <div className="mt-3 text-sm">
                      <div className="mb-2">
                        <strong className="text-red-700">Lỗi:</strong>
                        <pre className="mt-1 text-xs bg-red-100 p-2 rounded overflow-auto">
                          {this.state.error.message}
                        </pre>
                      </div>
                      {this.state.error.stack && (
                        <div className="mb-2">
                          <strong className="text-red-700">Stack trace:</strong>
                          <pre className="mt-1 text-xs bg-red-100 p-2 rounded overflow-auto max-h-32">
                            {this.state.error.stack}
                          </pre>
                        </div>
                      )}
                      {this.state.errorInfo?.componentStack && (
                        <div>
                          <strong className="text-red-700">Component stack:</strong>
                          <pre className="mt-1 text-xs bg-red-100 p-2 rounded overflow-auto max-h-32">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={this.handleReset}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
                >
                  <RefreshCw className="h-4 w-4" />
                  Thử lại
                </Button>
                <Button
                  onClick={this.handleRefresh}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Tải lại trang
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Về trang chủ
                </Button>
              </div>

              {/* Additional Info */}
              <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                <p className="text-sm text-gray-500 mb-2">
                  Mã lỗi: {Date.now().toString(36).toUpperCase()}
                </p>
                <p className="text-xs text-gray-400">
                  Thời gian: {new Date().toLocaleString('vi-VN')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;