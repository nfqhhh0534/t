import React from 'react';

interface AvatarProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeStyles = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl',
};

export function Avatar({ name, size = 'md', className = '' }: AvatarProps) {
  const initial = name.charAt(0);
  const gradients = [
    'from-indigo-500 to-cyan-500',
    'from-purple-500 to-pink-500',
    'from-orange-500 to-yellow-500',
    'from-green-500 to-teal-500',
    'from-blue-500 to-indigo-500',
  ];
  const gradientIndex = name.charCodeAt(0) % gradients.length;

  return (
    <div
      className={`${sizeStyles[size]} bg-gradient-to-br ${gradients[gradientIndex]} rounded-full flex items-center justify-center text-white font-semibold ${className}`}
    >
      {initial}
    </div>
  );
}
