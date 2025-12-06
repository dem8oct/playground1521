import { HTMLAttributes, ReactNode } from 'react'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default'
}

const Badge = ({ children, variant = 'default', className = '', ...props }: BadgeProps) => {
  const variants = {
    success: 'bg-neon-green text-bg-primary border-neon-green',
    warning: 'bg-neon-yellow text-bg-primary border-neon-yellow',
    danger: 'bg-neon-pink text-white border-neon-pink',
    info: 'bg-bg-secondary text-neon-green border-neon-green',
    default: 'bg-bg-secondary text-white border-border',
  }

  return (
    <span
      className={`inline-block px-3 py-1 text-xs font-mono font-bold border-2 rounded ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}

export default Badge
