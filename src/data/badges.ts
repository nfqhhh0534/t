// 徽章系统配置
import { Badge, User } from '@/types';

// 徽章类型定义
export interface BadgeDefinition {
  id: string;
  name: string;
  icon: string;
  description: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'; // 徽章等级
  condition: (user: User, stats: UserStats) => boolean; // 获得条件
  category: 'engagement' | 'quality' | 'consistency' | 'achievement'; // 徽章分类
}

export interface UserStats {
  totalQuestions: number;      // 累计问题数
  totalAnswers: number;        // 累计回答数
  acceptedAnswers: number;     // 被采纳回答数
  totalLikes: number;          // 累计收到的赞
  totalViews: number;          // 累计浏览量
  insightsCount: number;       // 发布的见闻数
  projectsCount: number;       // 发布的项目数
  consecutiveDays: number;     // 连续活跃天数
  dailyActivities: number;     // 活跃天数
  currentStreak: number;       // 当前连续天数
}

// 徽章定义列表
export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // === 参与类徽章 (engagement) ===
  {
    id: 'first_post',
    name: '初出茅庐',
    icon: '🌱',
    description: '发布第一篇内容',
    tier: 'bronze',
    category: 'engagement',
    condition: (user, stats) => stats.totalQuestions + stats.totalAnswers >= 1,
  },
  {
    id: 'active_contributor',
    name: '活跃贡献者',
    icon: '🌿',
    description: '累计发布10篇内容',
    tier: 'bronze',
    category: 'engagement',
    condition: (user, stats) => stats.totalQuestions + stats.totalAnswers >= 10,
  },
  {
    id: 'prolific_writer',
    name: '高产作者',
    icon: '📚',
    description: '累计发布50篇内容',
    tier: 'silver',
    category: 'engagement',
    condition: (user, stats) => stats.totalQuestions + stats.totalAnswers >= 50,
  },
  {
    id: 'content_master',
    name: '内容大师',
    icon: '📖',
    description: '累计发布100篇内容',
    tier: 'gold',
    category: 'engagement',
    condition: (user, stats) => stats.totalQuestions + stats.totalAnswers >= 100,
  },

  // === 质量类徽章 (quality) ===
  {
    id: 'helpful_helper',
    name: '热心帮手',
    icon: '🤝',
    description: '获得10个赞',
    tier: 'bronze',
    category: 'quality',
    condition: (user, stats) => stats.totalLikes >= 10,
  },
  {
    id: 'knowledge_star',
    name: '知识之星',
    icon: '⭐',
    description: '获得100个赞',
    tier: 'silver',
    category: 'quality',
    condition: (user, stats) => stats.totalLikes >= 100,
  },
  {
    id: 'popular_expert',
    name: '人气专家',
    icon: '✨',
    description: '获得500个赞',
    tier: 'gold',
    category: 'quality',
    condition: (user, stats) => stats.totalLikes >= 500,
  },
  {
    id: 'legendary_influencer',
    name: '传奇影响力',
    icon: '👑',
    description: '获得1000个赞',
    tier: 'platinum',
    category: 'quality',
    condition: (user, stats) => stats.totalLikes >= 1000,
  },

  // === 采纳类徽章 ===
  {
    id: 'first_solution',
    name: '初试牛刀',
    icon: '💡',
    description: '回答被采纳1次',
    tier: 'bronze',
    category: 'achievement',
    condition: (user, stats) => stats.acceptedAnswers >= 1,
  },
  {
    id: 'solution_expert',
    name: '解题专家',
    icon: '🔮',
    description: '回答被采纳10次',
    tier: 'silver',
    category: 'achievement',
    condition: (user, stats) => stats.acceptedAnswers >= 10,
  },
  {
    id: 'answer_master',
    name: '回答大师',
    icon: '🏅',
    description: '回答被采纳25次',
    tier: 'gold',
    category: 'achievement',
    condition: (user, stats) => stats.acceptedAnswers >= 25,
  },
  {
    id: 'community_legend',
    name: '社区传奇',
    icon: '🏆',
    description: '回答被采纳50次',
    tier: 'platinum',
    category: 'achievement',
    condition: (user, stats) => stats.acceptedAnswers >= 50,
  },

  // === 连续活跃类徽章 (consistency) ===
  {
    id: 'week_warrior',
    name: '周冠军',
    icon: '🔥',
    description: '连续7天活跃',
    tier: 'bronze',
    category: 'consistency',
    condition: (user, stats) => stats.consecutiveDays >= 7,
  },
  {
    id: 'monthly_devotee',
    name: '月度奉献者',
    icon: '🌟',
    description: '连续30天活跃',
    tier: 'silver',
    category: 'consistency',
    condition: (user, stats) => stats.consecutiveDays >= 30,
  },
  {
    id: 'iron_will',
    name: '铁意志',
    icon: '💪',
    description: '连续60天活跃',
    tier: 'gold',
    category: 'consistency',
    condition: (user, stats) => stats.consecutiveDays >= 60,
  },
  {
    id: 'unstoppable',
    name: '永不停歇',
    icon: '🚀',
    description: '连续100天活跃',
    tier: 'platinum',
    category: 'consistency',
    condition: (user, stats) => stats.consecutiveDays >= 100,
  },

  // === 能量值类徽章 ===
  {
    id: 'energy_collector',
    name: '能量收集者',
    icon: '🔋',
    description: '能量值达到1000',
    tier: 'bronze',
    category: 'achievement',
    condition: (user) => user.energy >= 1000,
  },
  {
    id: 'energy_knight',
    name: '能量骑士',
    icon: '⚔️',
    description: '能量值达到5000',
    tier: 'silver',
    category: 'achievement',
    condition: (user) => user.energy >= 5000,
  },
  {
    id: 'energy_champion',
    name: '能量冠军',
    icon: '🏰',
    description: '能量值达到20000',
    tier: 'gold',
    category: 'achievement',
    condition: (user) => user.energy >= 20000,
  },
  {
    id: 'energy_legend',
    name: '能量传说',
    icon: '👑',
    description: '能量值达到50000',
    tier: 'platinum',
    category: 'achievement',
    condition: (user) => user.energy >= 50000,
  },

  // === 见闻类徽章 ===
  {
    id: 'insight_seeker',
    name: '见闻达人',
    icon: '🔭',
    description: '发布5篇见闻',
    tier: 'bronze',
    category: 'engagement',
    condition: (user, stats) => stats.insightsCount >= 5,
  },
  {
    id: 'insight_master',
    name: '见闻大师',
    icon: '🎯',
    description: '发布20篇见闻',
    tier: 'silver',
    category: 'engagement',
    condition: (user, stats) => stats.insightsCount >= 20,
  },

  // === 项目类徽章 ===
  {
    id: 'project_starter',
    name: '项目发起者',
    icon: '🚀',
    description: '发布3个项目',
    tier: 'bronze',
    category: 'engagement',
    condition: (user, stats) => stats.projectsCount >= 3,
  },
  {
    id: 'project_leader',
    name: '项目领袖',
    icon: '🎖️',
    description: '发布10个项目',
    tier: 'silver',
    category: 'engagement',
    condition: (user, stats) => stats.projectsCount >= 10,
  },
];

// 徽章等级颜色
export const BADGE_TIER_COLORS: Record<BadgeDefinition['tier'], { bg: string; border: string; text: string }> = {
  bronze: { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-700' },
  silver: { bg: 'bg-slate-100', border: 'border-slate-300', text: 'text-slate-700' },
  gold: { bg: 'bg-yellow-100', border: 'border-yellow-400', text: 'text-yellow-700' },
  platinum: { bg: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-700' },
};

// 徽章等级图标
export const BADGE_TIER_ICONS: Record<BadgeDefinition['tier'], string> = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '💎',
};

// 检查用户是否满足某个徽章的获得条件
export function checkBadgeEligibility(
  badge: BadgeDefinition,
  user: User,
  stats: UserStats
): boolean {
  return badge.condition(user, stats);
}

// 获取用户应获得的所有徽章
export function getEligibleBadges(
  user: User,
  stats: UserStats
): BadgeDefinition[] {
  return BADGE_DEFINITIONS.filter(badge => checkBadgeEligibility(badge, user, stats));
}

// 获取用户新获得的徽章（排除已有的）
export function getNewBadges(
  user: User,
  stats: UserStats
): BadgeDefinition[] {
  const eligibleBadges = getEligibleBadges(user, stats);
  const existingBadgeIds = new Set(user.badges.map(b => b.id));
  return eligibleBadges.filter(badge => !existingBadgeIds.has(badge.id));
}

// 将 BadgeDefinition 转换为 Badge 类型
export function toBadge(badgeDef: BadgeDefinition): Badge {
  return {
    id: badgeDef.id,
    name: badgeDef.name,
    icon: badgeDef.icon,
    description: badgeDef.description,
  };
}
