import React, { useState } from 'react';
import { Badge } from '@/types';
import { BADGE_TIER_COLORS, BADGE_TIER_ICONS, BADGE_DEFINITIONS, BadgeDefinition, UserStats } from '@/data/badges';
import { Award, Lock, Check, X } from 'lucide-react';

interface BadgeDisplayProps {
  badges: Badge[];
  userStats?: UserStats;
  showLocked?: boolean; // 是否显示未解锁的徽章
  size?: 'sm' | 'md' | 'lg';
  maxDisplay?: number; // 最多显示的徽章数量
}

export function BadgeDisplay({
  badges,
  userStats,
  showLocked = false,
  size = 'md',
  maxDisplay
}: BadgeDisplayProps) {
  const [showAll, setShowAll] = useState(false);
  const [showLockedModal, setShowLockedModal] = useState(false);

  const unlockedBadgeIds = new Set(badges.map(b => b.id));

  // 徽章尺寸样式
  const sizeStyles = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-1.5',
    lg: 'px-4 py-2 text-base gap-2',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  // 获取徽章定义
  const getBadgeDef = (badgeId: string): BadgeDefinition | undefined => {
    return BADGE_DEFINITIONS.find(d => d.id === badgeId);
  };

  // 获取未解锁的徽章
  const lockedBadges = showLocked ? BADGE_DEFINITIONS.filter(d => !unlockedBadgeIds.has(d.id)) : [];

  // 过滤要显示的徽章
  const displayBadges = maxDisplay && !showAll
    ? badges.slice(0, maxDisplay)
    : badges;

  // 未解锁徽章预览
  const previewLockedBadges = maxDisplay && badges.length >= maxDisplay
    ? lockedBadges.slice(0, 3)
    : [];

  if (badges.length === 0 && !showLocked) {
    return null;
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {/* 已解锁的徽章 */}
        {displayBadges.map(badge => {
          const def = getBadgeDef(badge.id);
          if (!def) return null;
          const tierStyle = BADGE_TIER_COLORS[def.tier];

          return (
            <div
              key={badge.id}
              className={`
                inline-flex items-center rounded-full border transition-all hover:shadow-md
                ${sizeStyles[size]}
                ${tierStyle.bg} ${tierStyle.border}
              `}
              title={`${badge.name}: ${badge.description}${badge.unlockedAt ? `\n解锁时间: ${new Date(badge.unlockedAt).toLocaleDateString()}` : ''}`}
            >
              <span className={iconSizes[size]}>{badge.icon}</span>
              <span className={`font-medium ${tierStyle.text}`}>{badge.name}</span>
            </div>
          );
        })}

        {/* 显示更多的按钮 */}
        {maxDisplay && badges.length > maxDisplay && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <Award className="w-3.5 h-3.5" />
            <span>+{badges.length - maxDisplay}</span>
          </button>
        )}

        {/* 未解锁徽章预览 */}
        {showLocked && previewLockedBadges.length > 0 && (
          <button
            onClick={() => setShowLockedModal(true)}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-slate-400 bg-slate-100 rounded-full border border-dashed border-slate-300 hover:border-slate-400 transition-colors"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{lockedBadges.length} 未解锁</span>
          </button>
        )}
      </div>

      {/* 未解锁徽章模态框 */}
      {showLockedModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowLockedModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-amber-50 to-orange-50">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-6 h-6 text-amber-500" />
                全部徽章
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                已解锁 {badges.length} / {BADGE_DEFINITIONS.length} 个徽章
              </p>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* 已解锁 */}
              <div className="mb-8">
                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  已解锁
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {badges.map(badge => {
                    const def = getBadgeDef(badge.id);
                    if (!def) return null;
                    const tierStyle = BADGE_TIER_COLORS[def.tier];

                    return (
                      <div
                        key={badge.id}
                        className={`p-4 rounded-xl border-2 ${tierStyle.bg} ${tierStyle.border}`}
                      >
                        <div className="text-3xl mb-2">{badge.icon}</div>
                        <div className={`font-semibold ${tierStyle.text}`}>{badge.name}</div>
                        <div className="text-xs text-slate-500 mt-1">{badge.description}</div>
                        <div className="text-xs text-slate-400 mt-2">
                          {BADGE_TIER_ICONS[def.tier]} {def.tier === 'bronze' ? '青铜' : def.tier === 'silver' ? '白银' : def.tier === 'gold' ? '黄金' : '钻石'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 未解锁 */}
              {lockedBadges.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-slate-400" />
                    未解锁
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {lockedBadges.map(def => {
                      const tierStyle = BADGE_DEFINITIONS.find(d => d.id === def.id);
                      if (!tierStyle) return null;
                      const style = BADGE_TIER_COLORS[def.tier];

                      return (
                        <div
                          key={def.id}
                          className="p-4 rounded-xl border border-slate-200 bg-slate-50 opacity-60"
                        >
                          <div className="text-3xl mb-2 grayscale">{def.icon}</div>
                          <div className="font-semibold text-slate-500">{def.name}</div>
                          <div className="text-xs text-slate-400 mt-1">{def.description}</div>
                          <div className="text-xs text-slate-400 mt-2">
                            {BADGE_TIER_ICONS[def.tier]} {def.tier === 'bronze' ? '青铜' : def.tier === 'silver' ? '白银' : def.tier === 'gold' ? '黄金' : '钻石'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => setShowLockedModal(false)}
                className="w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// 徽章获得通知组件
interface BadgeNotificationProps {
  badge: Badge;
  onClose: () => void;
}

export function BadgeNotification({ badge, onClose }: BadgeNotificationProps) {
  const def = BADGE_DEFINITIONS.find(d => d.id === badge.id);
  if (!def) return null;
  const tierStyle = BADGE_TIER_COLORS[def.tier];

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div className={`
        p-4 rounded-2xl shadow-2xl border-2 max-w-sm
        ${tierStyle.bg} ${tierStyle.border}
        animate-pulse
      `}>
        <div className="flex items-start gap-3">
          <div className="text-4xl">{badge.icon}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Award className={`w-5 h-5 ${tierStyle.text}`} />
              <span className={`font-bold ${tierStyle.text}`}>新徽章解锁!</span>
            </div>
            <div className={`font-semibold text-lg mt-1 ${tierStyle.text}`}>{badge.name}</div>
            <div className="text-sm text-slate-600 mt-1">{badge.description}</div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
