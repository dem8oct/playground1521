import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, disabled, ...props }, ref) => {
    const baseStyles = 'font-mono font-bold transition-all duration-150 active:translate-x-1 active:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-x-0 disabled:active:translate-y-0'

    const variants = {
      primary: 'bg-neon-green text-bg-primary border-4 border-black shadow-brutal hover:shadow-brutal-sm',
      secondary: 'bg-bg-secondary text-neon-green border-4 border-neon-green shadow-brutal-neon-green hover:shadow-brutal-sm',
      danger: 'bg-neon-pink text-white border-4 border-black shadow-brutal hover:shadow-brutal-sm',
      ghost: 'bg-transparent text-neon-green border-4 border-border hover:border-neon-green',
    }

    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
    }

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
