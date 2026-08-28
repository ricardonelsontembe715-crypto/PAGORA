import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const isSpinnerActive = isLoading || loading;
    // Math-based padding and optical sizes
    const sizeClasses = {
      sm: 'text-xs px-3 py-1.5 rounded-md gap-1.5 font-medium',
      md: 'text-sm px-4 py-2 rounded-lg gap-2 font-medium',
      lg: 'text-base px-5 py-2.5 rounded-lg gap-2.5 font-semibold',
    };

    const variantClasses = {
      primary:
        'bg-[#4F46E5] text-white hover:bg-[#3730A3] active:bg-[#312E81] shadow-xs border border-transparent focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
      secondary:
        'bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300 border border-slate-200 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2',
      outline:
        'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 active:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
      ghost:
        'bg-transparent text-slate-700 hover:bg-slate-100 active:bg-slate-200 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-400',
      danger:
        'bg-[#DC2626] text-white hover:bg-red-700 active:bg-red-800 shadow-xs border border-transparent focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2',
      link:
        'bg-transparent text-[#4F46E5] hover:underline p-0 h-auto font-medium focus-visible:ring-2 focus-visible:ring-indigo-500',
    };

    const baseClasses =
      'inline-flex items-center justify-center transition-all duration-150 active:scale-[0.98] cursor-pointer select-none focus:outline-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none disabled:active:scale-100 whitespace-nowrap';

    return (
      <button
        ref={ref}
        id={id}
        disabled={disabled || isSpinnerActive}
        className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${
          fullWidth ? 'w-full' : ''
        } ${className}`}
        {...props}
      >
        {isSpinnerActive && <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />}
        {!isSpinnerActive && leftIcon && <span className="shrink-0">{leftIcon}</span>}
        <span>{children}</span>
        {!isSpinnerActive && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
