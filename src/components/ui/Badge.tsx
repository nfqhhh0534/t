import React from 'react';
import { ReputationLevel } from '@/types';
import { levelInfo } from '@/utils';

interface LevelBadgeProps {
  level: ReputationLevel;
  showNumber?: number;
  size?: 'sm' | 'md';
}

const levelIcons: Record<ReputationLevel, string> = {
  newstar: '⭐',
  star: '✨',
  moonlight: '🌙',
  sunshine: '☀️',
  supernova: '💫',
};

const levelGradients: Record<ReputationLevel, string> = {
  newstar: 'from-slate-400 to-slate-500',
  star: 'from-cyan-500 to-cyan-400',
  moonlight: 'from-indigo-600 to-indigo-400',
  sunshine: 'from-orange-500 to-orange-400',
  supernova: 'from-purple-600 to-purple-400',
};

export function LevelBadge({ level, showNumber, size = 'md' }: LevelBadgeProps) {
  const info = levelInfo[level];
  const sizeStyles = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold bg-gradient-to-r ${levelGradients[level]} text-white ${sizeStyles} ${level === 'supernova' ? 'shadow-lg shadow-purple-200' : ''}`}
    >
      <span>{levelIcons[level]}</span>
      <span>Lv.{showNumber || ''} {info.name}</span>
    </span>
  );
}

interface StatusBadgeProps {
  status: 'resolved' | 'unresolved' | 'pending' | 'online' | 'featured';
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
    resolved: { label: '已解决', bg: 'bg-emerald-100', text: 'text-emerald-600' },
    unresolved: { label: '待解决', bg: 'bg-slate-100', text: 'text-slate-600' },
    pending: { label: '审核中', bg: 'bg-amber-100', text: 'text-amber-600' },
    online: { label: '已上线', bg: 'bg-emerald-100', text: 'text-emerald-600' },
    featured: { label: '精选', bg: 'bg-gradient-to-r from-amber-400 to-orange-400', text: 'text-white' },
  };

  const config = statusConfig[status];
  const sizeStyles = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${config.bg} ${config.text} ${sizeStyles}`}>
      {status === 'featured' && '🔥 '}
      {config.label}
    </span>
  );
}

interface ExpertBadgeProps {
  size?: 'sm' | 'md';
}

export function ExpertBadge({ size = 'sm' }: ExpertBadgeProps) {
  const sizeStyles = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium bg-gradient-to-r from-amber-400 to-orange-400 text-white ${sizeStyles}`}>
      🔥 认证专家
    </span>
  );
}
