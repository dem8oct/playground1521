import { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  variant?: 'default' | 'neon-green' | 'neon-pink' | 'neon-yellow'
}

const Card = ({ children, variant = 'default', className = '', ...props }: CardProps) => {
  const variants = {
    default: 'bg-bg-card border-border shadow-brutal',
    'neon-green': 'bg-bg-card border-neon-green shadow-brutal-neon-green',
    'neon-pink': 'bg-bg-card border-neon-pink shadow-brutal-neon-pink',
    'neon-yellow': 'bg-bg-card border-neon-yellow shadow-brutal-neon-yellow',
  }

  return (
    <div
      className={`border-4 rounded-lg p-6 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export default Card
