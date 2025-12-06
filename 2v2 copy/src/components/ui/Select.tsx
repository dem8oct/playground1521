import { SelectHTMLAttributes, forwardRef } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block font-mono text-sm text-neon-green mb-2">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`
            w-full px-4 py-3
            bg-bg-secondary text-white
            border-4 border-border
            font-mono
            focus:outline-none focus:border-neon-green
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-neon-pink' : ''}
            ${className}
          `}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-2 text-sm text-neon-pink font-mono">{error}</p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

export default Select
