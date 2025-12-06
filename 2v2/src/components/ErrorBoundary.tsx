import { Component, ErrorInfo, ReactNode } from 'react'
import { trackError } from '../lib/errorTracking'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    trackError(error, {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack || undefined,
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-dark-surface border-2 border-neon-pink rounded-lg p-6 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="font-display text-2xl text-neon-pink mb-3">
              Oops! Something went wrong
            </h1>
            <p className="font-mono text-sm text-gray-300 mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="font-mono px-6 py-2 bg-neon-pink text-dark-bg rounded hover:opacity-80 transition-opacity"
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
