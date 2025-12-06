import { Button } from './ui'

/**
 * Test component for verifying error tracking
 * This component should be removed or commented out in production
 */
export function ErrorTestComponent() {
  const triggerError = () => {
    throw new Error('Test error - Error tracking is working!')
  }

  const triggerPromiseRejection = () => {
    Promise.reject(new Error('Test promise rejection - Error tracking is working!'))
  }

  return (
    <div className="fixed bottom-4 right-4 bg-dark-surface border-2 border-yellow-500 rounded p-4 max-w-xs">
      <p className="font-mono text-xs text-yellow-500 mb-2">
        Error Tracking Test (Dev Only)
      </p>
      <div className="flex flex-col gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={triggerError}
        >
          Test Error Boundary
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={triggerPromiseRejection}
        >
          Test Promise Rejection
        </Button>
      </div>
    </div>
  )
}
