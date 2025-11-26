import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block font-mono text-sm text-neon-green mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-3
            bg-bg-secondary text-white
            border-4 border-border
            font-mono
            focus:outline-none focus:border-neon-green
            placeholder:text-gray-500
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-neon-pink' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm text-neon-pink font-mono">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
