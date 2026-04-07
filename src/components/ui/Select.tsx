'use client';
import { cn } from '@/lib/utils';
import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Select({
  label,
  error,
  hint,
  options,
  placeholder,
  className,
  id,
  ...props
}: SelectProps) {
  const fieldId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={fieldId} className="text-sm font-semibold text-gray-700">
          {label}
        </label>
      )}
      <select
        id={fieldId}
        className={cn(
          'w-full rounded-xl border border-surface-border bg-white px-3 py-2.5 text-sm text-gray-800',
          'focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand',
          'disabled:bg-gray-50 disabled:text-gray-400',
          error && 'border-red-400 focus:ring-red-400',
          className
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className, id, ...props }: InputProps) {
  const fieldId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={fieldId} className="text-sm font-semibold text-gray-700">
          {label}
        </label>
      )}
      <input
        id={fieldId}
        className={cn(
          'w-full rounded-xl border border-surface-border bg-white px-3 py-2.5 text-sm text-gray-800',
          'focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand',
          'placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-400',
          error && 'border-red-400 focus:ring-red-400',
          className
        )}
        {...props}
      />
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// Toggle / segmented control (Yes/No, Product/Service, etc.)
interface SegmentedControlProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

export function SegmentedControl({
  options,
  value,
  onChange,
  label,
  className
}: SegmentedControlProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && <span className="text-sm font-semibold text-gray-700">{label}</span>}
      <div className="flex gap-1 p-1 rounded-xl bg-surface-muted border border-surface-border w-fit">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'rounded-lg px-4 py-1.5 text-sm font-medium transition-all duration-200',
              value === opt.value
                ? 'bg-brand text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
