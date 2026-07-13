import React, { Component } from "react";

/**
 * ErrorBoundary Component
 * Catches JavaScript errors anywhere in the child component tree,
 * logs the errors, and displays a fallback UI (GeneralErrorPage)
 * 
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError() {
    // Update state so the next render shows the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });

    // You can also log to an error reporting service here
    // logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback - inline error page
      return (
        <div className="error-boundary">
          <div className="error-boundary__content">
            <div className="error-boundary__icon">
              <i className="fa-solid fa-bug"></i>
            </div>
            <h1 className="error-boundary__title">Ôi! Đã xảy ra sự cố</h1>
            <p className="error-boundary__message">
              Đã xảy ra lỗi ngoài dự kiến. Vui lòng thử tải lại trang.
            </p>
            {this.state.error && (
              <details className="error-boundary__details">
                <summary>Chi tiết lỗi</summary>
                <pre>{this.state.error.toString()}</pre>
                {this.state.errorInfo && (
                  <pre>{this.state.errorInfo.componentStack}</pre>
                )}
              </details>
            )}
            <button
              className="error-boundary__btn"
              onClick={() => window.location.href = "/"}
            >
              Về trang chủ
            </button>
          </div>
          <style>{`
            .error-boundary {
              min-height: 100vh;
              background: #f8fafc;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 24px;
              font-family: 'Be Vietnam Pro', 'Inter', 'Noto Sans', sans-serif;
            }
            .error-boundary__content {
              max-width: 500px;
              text-align: center;
            }
            .error-boundary__icon {
              font-size: 64px;
              color: #ef4444;
              margin-bottom: 24px;
            }
            .error-boundary__title {
              margin: 0 0 16px 0;
              font-size: 28px;
              font-weight: 600;
              color: #0f172a;
            }
            .error-boundary__message {
              margin: 0 0 24px 0;
              font-size: 14px;
              color: #64748b;
              line-height: 1.6;
            }
            .error-boundary__details {
              margin-bottom: 24px;
              padding: 12px;
              background: #fef2f2;
              border: 1px solid #fecaca;
              border-radius: 8px;
              text-align: left;
            }
            .error-boundary__details summary {
              cursor: pointer;
              font-weight: 600;
              color: #ef4444;
              margin-bottom: 8px;
            }
            .error-boundary__details pre {
              margin: 0;
              font-size: 11px;
              color: #64748b;
              white-space: pre-wrap;
              word-break: break-all;
              overflow-x: auto;
            }
            .error-boundary__btn {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              min-width: 180px;
              padding: 12px 32px;
              background: #0ea5e9;
              color: #fff;
              border: none;
              border-radius: 24px;
              font-size: 14px;
              font-weight: 600;
              cursor: pointer;
              transition: background 0.2s ease;
            }
            .error-boundary__btn:hover {
              background: #0284c7;
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
