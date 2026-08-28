import React from 'react';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  className?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  options,
  value,
  onChange,
  label,
  error,
  className = '',
}) => {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && <span className="text-xs font-semibold text-slate-700">{label}</span>}
      <div className="flex flex-col gap-2">
        {options.map((option) => {
          const isChecked = value === option.value;
          const optionId = `radio-${name}-${option.value}`;

          return (
            <label
              key={option.value}
              htmlFor={optionId}
              className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                isChecked
                  ? 'border-indigo-600 bg-indigo-50/40'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              } ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input
                type="radio"
                id={optionId}
                name={name}
                value={option.value}
                checked={isChecked}
                disabled={option.disabled}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
                  isChecked
                    ? 'border-indigo-600 bg-white'
                    : 'border-slate-300 bg-white'
                }`}
              >
                {isChecked && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
              </div>
              <div className="flex flex-col text-sm">
                <span className={`font-medium ${isChecked ? 'text-indigo-950' : 'text-slate-800'}`}>
                  {option.label}
                </span>
                {option.description && (
                  <span className="text-xs text-slate-500 mt-0.5">{option.description}</span>
                )}
              </div>
            </label>
          );
        })}
      </div>
      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
};
