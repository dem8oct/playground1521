import { createContext, useContext, useEffect, ReactNode } from 'react'
import { posthog, initPostHog } from '../lib/posthog'
import { setupGlobalErrorHandlers } from '../lib/errorTracking'

interface PostHogContextType {
  posthog: typeof posthog
}

const PostHogContext = createContext<PostHogContextType | undefined>(undefined)

export function PostHogProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    initPostHog()
    setupGlobalErrorHandlers()
  }, [])

  return (
    <PostHogContext.Provider value={{ posthog }}>
      {children}
    </PostHogContext.Provider>
  )
}

export function usePostHog() {
  const context = useContext(PostHogContext)
  if (context === undefined) {
    throw new Error('usePostHog must be used within a PostHogProvider')
  }
  return context
}
