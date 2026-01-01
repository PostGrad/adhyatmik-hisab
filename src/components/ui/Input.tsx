import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils';

// ============================================================================
// Text Input
// ============================================================================

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, className, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2)}`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-ink mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-light">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full px-3 py-2.5 rounded-[var(--radius-input)]',
              'bg-white border border-saffron-200',
              'text-ink placeholder:text-ink-light/60',
              'transition-colors duration-150',
              'focus:outline-none focus:border-saffron-500 focus:ring-2 focus:ring-saffron-500/20',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
              icon ? 'pl-10' : '',
              className
            )}
            {...props}
          />
        </div>
        {(error || hint) && (
          <p className={cn(
            'text-sm mt-1.5',
            error ? 'text-red-600' : 'text-ink-light'
          )}>
            {error || hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// ============================================================================
// Textarea
// ============================================================================

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id || `textarea-${Math.random().toString(36).slice(2)}`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-ink mb-1.5"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-3 py-2.5 rounded-[var(--radius-input)]',
            'bg-white border border-saffron-200',
            'text-ink placeholder:text-ink-light/60',
            'transition-colors duration-150 resize-none',
            'focus:outline-none focus:border-saffron-500 focus:ring-2 focus:ring-saffron-500/20',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            className
          )}
          {...props}
        />
        {(error || hint) && (
          <p className={cn(
            'text-sm mt-1.5',
            error ? 'text-red-600' : 'text-ink-light'
          )}>
            {error || hint}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// ============================================================================
// Select
// ============================================================================

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<InputHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  error?: string;
  options: SelectOption[];
  onChange?: (value: string) => void;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, onChange, className, id, value, ...props }, ref) => {
    const inputId = id || `select-${Math.random().toString(36).slice(2)}`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-ink mb-1.5"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className={cn(
            'w-full px-3 py-2.5 rounded-[var(--radius-input)]',
            'bg-white border border-saffron-200',
            'text-ink',
            'transition-colors duration-150',
            'focus:outline-none focus:border-saffron-500 focus:ring-2 focus:ring-saffron-500/20',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            className
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="text-sm mt-1.5 text-red-600">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

// ============================================================================
// PIN Input
// ============================================================================

interface PinInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  autoFocus?: boolean;
}

export function PinInput({ 
  length = 4, 
  value, 
  onChange, 
  error = false,
  autoFocus = false 
}: PinInputProps) {
  const handleChange = (index: number, digit: string) => {
    if (!/^\d*$/.test(digit)) return;
    
    const newValue = value.split('');
    newValue[index] = digit.slice(-1);
    const result = newValue.join('').slice(0, length);
    onChange(result);
    
    // Auto-focus next input
    if (digit && index < length - 1) {
      const nextInput = document.getElementById(`pin-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      const prevInput = document.getElementById(`pin-${index - 1}`);
      prevInput?.focus();
    }
  };

  return (
    <div className="flex gap-3 justify-center">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          id={`pin-${index}`}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={value[index] || ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          autoFocus={autoFocus && index === 0}
          className={cn(
            'w-14 h-14 text-center text-2xl font-semibold',
            'rounded-xl border-2',
            'transition-all duration-150',
            'focus:outline-none focus:border-saffron-500 focus:ring-4 focus:ring-saffron-500/20',
            error 
              ? 'border-red-500 bg-red-50 animate-shake' 
              : 'border-saffron-200 bg-white'
          )}
        />
      ))}
    </div>
  );
}

