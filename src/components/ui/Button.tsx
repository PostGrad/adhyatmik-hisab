import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
  className?: string;
  children?: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-saffron-600 text-white
    hover:bg-saffron-700 active:bg-saffron-800
    shadow-button
  `,
  secondary: `
    bg-forest-600 text-white
    hover:bg-forest-700 active:bg-forest-800
    shadow-button
  `,
  ghost: `
    bg-transparent text-ink
    hover:bg-saffron-100 active:bg-saffron-200
  `,
  danger: `
    bg-red-600 text-white
    hover:bg-red-700 active:bg-red-800
    shadow-button
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2.5 text-base gap-2',
  lg: 'px-6 py-3 text-lg gap-2.5',
};

const iconSizeStyles: Record<ButtonSize, string> = {
  sm: '[&_svg]:w-4 [&_svg]:h-4',
  md: '[&_svg]:w-5 [&_svg]:h-5',
  lg: '[&_svg]:w-6 [&_svg]:h-6',
};

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  disabled,
  type = 'button',
  onClick,
  className,
  children,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      type={type}
      whileTap={{ scale: isDisabled ? 1 : 0.98 }}
      disabled={isDisabled}
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center font-medium',
        'rounded-[var(--radius-button)] transition-colors duration-150',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-saffron-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        iconSizeStyles[size],
        fullWidth && 'w-full',
        className
      )}
    >
      {loading ? (
        <span className="animate-spin">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </span>
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          {children}
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </motion.button>
  );
}

// Icon-only button variant
interface IconButtonProps {
  icon: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  label: string;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  title?: string;
}

export function IconButton({ 
  icon, 
  variant = 'ghost', 
  size = 'md', 
  label, 
  disabled,
  onClick,
  className,
  title,
}: IconButtonProps) {
  const sizeMap = { sm: 'p-1.5', md: 'p-2', lg: 'p-3' };

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.95 }}
      aria-label={label}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center rounded-full',
        'transition-colors duration-150',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-saffron-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeMap[size],
        iconSizeStyles[size],
        className
      )}
    >
      {icon}
    </motion.button>
  );
}
