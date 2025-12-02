import { ReactNode } from 'react'

interface PageLayoutProps {
  children: ReactNode
  header?: ReactNode
  title?: string
}

const PageLayout = ({ children, header, title }: PageLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col relative">
      {header && (
        <header className="bg-bg-secondary border-b-4 border-border p-4 z-10">
          <div className="max-w-7xl mx-auto">{header}</div>
        </header>
      )}
      {title && !header && (
        <header className="bg-bg-secondary border-b-4 border-border p-4 z-10">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-neon-green">{title}</h1>
          </div>
        </header>
      )}
      <main className="flex-1 p-4 md:p-8 z-10">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  )
}

export default PageLayout
