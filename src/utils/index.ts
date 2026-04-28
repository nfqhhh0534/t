import { ReputationLevel } from '@/types';

// 声望等级信息
export const levelInfo: Record<ReputationLevel, { name: string; minEnergy: number; maxEnergy: number; color: string }> = {
  newstar: { name: '新星', minEnergy: 0, maxEnergy: 2000, color: '#94A3B8' },
  star: { name: '星辰', minEnergy: 2001, maxEnergy: 5000, color: '#06B6D4' },
  moonlight: { name: '月华', minEnergy: 5001, maxEnergy: 20000, color: '#4F46E5' },
  sunshine: { name: '烈阳', minEnergy: 20001, maxEnergy: 50000, color: '#F59E0B' },
  supernova: { name: '超新星', minEnergy: 50001, maxEnergy: Infinity, color: '#8B5CF6' },
};

// 根据能量值获取等级
export function getLevelFromEnergy(energy: number): ReputationLevel {
  if (energy <= 2000) return 'newstar';
  if (energy <= 5000) return 'star';
  if (energy <= 20000) return 'moonlight';
  if (energy <= 50000) return 'sunshine';
  return 'supernova';
}

// 获取等级对应的等级数
export function getLevelNumber(energy: number): number {
  if (energy <= 500) return 1;
  if (energy <= 1000) return 2;
  if (energy <= 2000) return 3;
  if (energy <= 3500) return 4;
  if (energy <= 5000) return 5;
  if (energy <= 7500) return 6;
  if (energy <= 10000) return 7;
  if (energy <= 15000) return 8;
  if (energy <= 20000) return 9;
  if (energy <= 30000) return 10;
  if (energy <= 40000) return 15;
  if (energy <= 50000) return 20;
  if (energy <= 75000) return 30;
  return 50;
}

// 获取下一个等级的能量需求
export function getNextLevelEnergy(energy: number): number {
  if (energy <= 500) return 500;
  if (energy <= 1000) return 1000;
  if (energy <= 2000) return 2000;
  if (energy <= 3500) return 3500;
  if (energy <= 5000) return 5000;
  if (energy <= 7500) return 7500;
  if (energy <= 10000) return 10000;
  if (energy <= 15000) return 15000;
  if (energy <= 20000) return 20000;
  if (energy <= 30000) return 30000;
  if (energy <= 40000) return 40000;
  if (energy <= 50000) return 50000;
  return 75000;
}

// 格式化数字
export function formatNumber(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}

// 格式化时间差
export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return days === 1 ? '昨天' : `${days}天前`;
  }
  if (hours > 0) {
    return `${hours}小时前`;
  }
  if (minutes > 0) {
    return `${minutes}分钟前`;
  }
  return '刚刚';
}

// 获取相对日期
export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days}天前`;
  if (days < 30) return `${Math.floor(days / 7)}周前`;
  if (days < 365) return `${Math.floor(days / 30)}个月前`;
  return `${Math.floor(days / 365)}年前`;
}

// 获取项目状态标签
export function getProjectStatusInfo(status: string): { label: string; color: string } {
  const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: '审核中', color: '#F59E0B' },
    researching: { label: '调研中', color: '#64748B' },
    developing: { label: '开发中', color: '#4F46E5' },
    testing: { label: '试运行', color: '#F59E0B' },
    online: { label: '已上线', color: '#10B981' },
    archived: { label: '已归档', color: '#94A3B8' },
  };
  return statusMap[status] || { label: status, color: '#64748B' };
}

// 获取问闻分类标签
export function getInsightCategoryInfo(category: string): { label: string; color: string } {
  const categoryMap: Record<string, { label: string; color: string }> = {
    industry: { label: '行业资讯', color: '#4F46E5' },
    tech: { label: '技术博文', color: '#06B6D4' },
    topic: { label: '专题策划', color: '#8B5CF6' },
    book: { label: '读书笔记', color: '#F59E0B' },
  };
  return categoryMap[category] || { label: category, color: '#64748B' };
}

// 获取产品分类标签
export function getProductCategoryInfo(category: string): { label: string; icon: string } {
  const categoryMap: Record<string, { label: string; icon: string }> = {
    aitool: { label: 'AI工具', icon: '🤖' },
    dataset: { label: '数据集', icon: '📊' },
    course: { label: '课程资源', icon: '📚' },
    merchandise: { label: '实物周边', icon: '🎁' },
    service: { label: '服务预约', icon: '💬' },
  };
  return categoryMap[category] || { label: category, icon: '📦' };
}

// 生成渐变色
export function generateGradient(colors: string[]): string {
  return `linear-gradient(135deg, ${colors.join(', ')})`;
}

// 获取热力图等级颜色
export function getHeatmapColor(level: number): string {
  const colors = [
    '#E2E8F0', // 无活动
    'rgba(79, 70, 229, 0.2)', // 低
    'rgba(79, 70, 229, 0.4)', // 中低
    'rgba(79, 70, 229, 0.6)', // 中
    'rgba(79, 70, 229, 0.8)', // 中高
    '#4F46E5', // 高
  ];
  return colors[Math.min(level, 5)];
}
