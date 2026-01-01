import { type ReactNode, type HTMLAttributes } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../utils';

interface CardProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  elevated?: boolean;
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export function Card({
  children,
  elevated = false,
  interactive = false,
  padding = 'md',
  className,
  ...props
}: CardProps) {
  return (
    <motion.div
      whileTap={interactive ? { scale: 0.99 } : undefined}
      className={cn(
        'bg-white rounded-[var(--radius-card)]',
        elevated ? 'shadow-elevated' : 'shadow-card',
        interactive && 'cursor-pointer hover:shadow-elevated transition-shadow',
        paddingStyles[padding],
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Card Header
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function CardHeader({ title, subtitle, action, className, ...props }: CardHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between mb-3', className)} {...props}>
      <div>
        <h3 className="font-semibold text-ink">{title}</h3>
        {subtitle && <p className="text-sm text-ink-light mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="ml-2">{action}</div>}
    </div>
  );
}

// Card Section Divider
export function CardDivider({ className }: { className?: string }) {
  return <hr className={cn('border-t border-saffron-100 my-3', className)} />;
}

// Empty State Card
interface EmptyCardProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyCard({ icon, title, description, action }: EmptyCardProps) {
  return (
    <Card className="text-center py-12">
      {icon && (
        <div className="text-saffron-300 mb-4 flex justify-center">
          {icon}
        </div>
      )}
      <h3 className="font-semibold text-ink mb-1">{title}</h3>
      {description && (
        <p className="text-ink-light text-sm max-w-xs mx-auto">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </Card>
  );
}

