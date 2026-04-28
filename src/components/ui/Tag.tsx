import React from 'react';

interface TagProps {
  children: React.ReactNode;
  color?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md';
  onClick?: () => void;
  className?: string;
}

export function Tag({
  children,
  color,
  variant = 'default',
  size = 'sm',
  onClick,
  className = '',
}: TagProps) {
  const variantStyles = {
    default: 'bg-slate-100 text-slate-600 border-slate-200',
    primary: 'bg-indigo-100 text-indigo-600 border-indigo-200',
    success: 'bg-emerald-100 text-emerald-600 border-emerald-200',
    warning: 'bg-amber-100 text-amber-600 border-amber-200',
    error: 'bg-red-100 text-red-600 border-red-200',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center rounded border font-medium ${variantStyles[variant]} ${sizeStyles[size]} ${onClick ? 'cursor-pointer hover:opacity-80' : ''} ${className}`}
      style={color ? { backgroundColor: `${color}20`, color, borderColor: color } : undefined}
      onClick={onClick}
    >
      {children}
    </span>
  );
}
