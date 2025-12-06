import { posthog } from './posthog'

export interface ErrorInfo {
  message: string
  stack?: string
  componentStack?: string
  url?: string
  userAgent?: string
  timestamp?: string
}

export function trackError(error: Error, errorInfo?: ErrorInfo) {
  const errorData: ErrorInfo = {
    message: error.message,
    stack: error.stack,
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
    ...errorInfo,
  }

  console.error('Error tracked:', errorData)

  posthog.capture('$exception', {
    $exception_message: error.message,
    $exception_type: error.name,
    $exception_stack_trace_raw: error.stack,
    $exception_level: 'error',
    ...errorData,
  })
}

export function setupGlobalErrorHandlers() {
  // Handle uncaught JavaScript errors
  window.addEventListener('error', (event) => {
    trackError(event.error || new Error(event.message), {
      message: event.message,
      stack: event.error?.stack,
    })
  })

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason))

    trackError(error, {
      message: `Unhandled Promise Rejection: ${error.message}`,
    })
  })

  console.log('Global error handlers initialized')
}
