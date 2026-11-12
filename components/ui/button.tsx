import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'yellow' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg' | 'icon';

export const buttonVariants: Record<Variant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover',
  yellow: 'bg-yellow text-cocoa hover:brightness-95',
  secondary: 'bg-surface text-fg shadow-[inset_0_0_0_1.5px_var(--ink)] hover:bg-subtle',
  ghost: 'bg-transparent text-fg-muted hover:bg-muted hover:text-fg',
  danger: 'bg-danger text-cream hover:opacity-90',
};

export const buttonSizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-[15px]',
  icon: 'h-8 w-8 p-0',
};

export const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-sm font-medium whitespace-nowrap transition duration-150 ease-out hover:-translate-y-px active:translate-y-0 disabled:pointer-events-none disabled:opacity-50';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, className, children, disabled, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(buttonBase, buttonVariants[variant], buttonSizes[size], className)}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});
