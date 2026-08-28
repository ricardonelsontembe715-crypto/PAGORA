import React from 'react';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  description?: string;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, error, id, className = '', checked, disabled, ...props }, ref) => {
    const checkboxId = id || (typeof label === 'string' ? `checkbox-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="flex flex-col gap-1">
        <label
          htmlFor={checkboxId}
          className={`flex items-start gap-2.5 cursor-pointer select-none ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <div className="relative flex items-center justify-center mt-0.5">
            <input
              type="checkbox"
              ref={ref}
              id={checkboxId}
              checked={checked}
              disabled={disabled}
              className="sr-only"
              {...props}
            />
            <div
              className={`w-4 h-4 rounded border transition-colors flex items-center justify-center ${
                checked
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'bg-white border-slate-300 hover:border-slate-400'
              } ${error ? 'border-red-500' : ''}`}
            >
              {checked && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          </div>
          {(label || description) && (
            <div className="flex flex-col text-sm">
              {label && <span className="font-medium text-slate-800 leading-tight">{label}</span>}
              {description && <span className="text-xs text-slate-500 mt-0.5">{description}</span>}
            </div>
          )}
        </label>
        {error && <p className="text-xs text-red-600 font-medium ml-6.5">{error}</p>}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
