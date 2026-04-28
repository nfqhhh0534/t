import React, { useState, useMemo, useEffect } from 'react';
import { Sparkles, TrendingUp, Award, Calendar, ChevronRight, Flame, Star, Trophy, Target, Zap, Clock, ArrowUpRight, Crown, Medal } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { POINT_RULES, PointHistory, PointReason } from '@/context/AppContext';
import { Card, Avatar } from '@/components/ui';
import { profilesApi, DbUser } from '@/services/supabase';
import { formatTimeAgo } from '@/utils';

// 声望等级配置
const LEVEL_CONFIG = {
  newstar: { name: '新星', min: 0, color: '#94a3b8', bg: 'bg-slate-100' },
  star: { name: '星芒', min: 500, color: '#22c55e', bg: 'bg-green-100' },
  moonlight: { name: '月光', min: 2000, color: '#3b82f6', bg: 'bg-blue-100' },
  sunshine: { name: '朝阳', min: 5000, color: '#f59e0b', bg: 'bg-amber-100' },
  supernova: { name: '超新星', min: 20000, color: '#ef4444', bg: 'bg-red-100' },
};

// 徽章配置
const BADGE_CONFIG = {
  first_post: { name: '首发', icon: '🎯', desc: '发布第一篇内容' },
  popular: { name: '热门', icon: '🔥', desc: '内容获得50个赞' },
  expert: { name: '专家', icon: '⭐', desc: '获得专家认证' },
  helpful: { name: '热心', icon: '💡', desc: '回答被采纳10次' },
  contributor: { name: '贡献者', icon: '🏆', desc: '累计发布100篇内容' },
  daily_streak: { name: '坚持', icon: '📅', desc: '连续登录30天' },
};

// 获取积分原因的中文描述
const getReasonDesc = (reason: PointReason): string => {
  return POINT_RULES[reason]?.desc || '其他';
};

// 贡献热力图组件
function ContributionGraph({ activities }: { activities: { date: string; count: number }[] }) {
  const [hoveredDay, setHoveredDay] = useState<{ date: string; count: number } | null>(null);

  // 计算每周的起始日期
  const weeks = useMemo(() => {
    const result: { date: string; count: number }[][] = [];
    let currentWeek: { date: string; count: number }[] = [];

    activities.forEach((day, index) => {
      currentWeek.push(day);
      if ((index + 1) % 7 === 0) {
        result.push(currentWeek);
        currentWeek = [];
      }
    });

    if (currentWeek.length > 0) {
      result.push(currentWeek);
    }

    return result;
  }, [activities]);

  // 获取颜色等级
  const getColorClass = (count: number) => {
    if (count === 0) return 'bg-slate-100';
    if (count <= 2) return 'bg-emerald-200';
    if (count <= 5) return 'bg-emerald-400';
    if (count <= 8) return 'bg-emerald-500';
    return 'bg-emerald-600';
  };

  return (
    <div className="relative">
      <div className="flex gap-1 overflow-x-auto pb-2">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-1">
            {week.map((day, dayIndex) => (
              <div
                key={`${weekIndex}-${dayIndex}`}
                className={`w-3 h-3 rounded-sm cursor-pointer transition-all hover:ring-2 hover:ring-indigo-400 ${getColorClass(day.count)}`}
                onMouseEnter={() => setHoveredDay(day)}
                onMouseLeave={() => setHoveredDay(null)}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Hover tooltip */}
      {hoveredDay && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
          {hoveredDay.date}: {hoveredDay.count} 次活动
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
        <span>少</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 bg-slate-100 rounded-sm" />
          <div className="w-3 h-3 bg-emerald-200 rounded-sm" />
          <div className="w-3 h-3 bg-emerald-400 rounded-sm" />
          <div className="w-3 h-3 bg-emerald-500 rounded-sm" />
          <div className="w-3 h-3 bg-emerald-600 rounded-sm" />
        </div>
        <span>多</span>
      </div>
    </div>
  );
}

export function PointsPage() {
  const { state, earnPoints } = useApp();
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'history' | 'rules'>('leaderboard');
  const { user, pointHistory, dailyActivities } = state;

  // Database users for ranking
  const [dbUsers, setDbUsers] = useState<DbUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Fetch users from database
  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    setLoadError(null);
    try {
      const usersData = await profilesApi.getAll();
      console.log('Fetched users from database:', usersData);
      // Filter out users with null reputation and set default 2000 if not set
      const usersWithReputation = (usersData || []).map(u => ({
        ...u,
        reputation: u.reputation ?? 2000
      }));
      console.log('Processed users with reputation:', usersWithReputation);
      setDbUsers(usersWithReputation);
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      setLoadError(error?.message || '加载用户数据失败');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Fetch users when leaderboard tab is active
  useEffect(() => {
    if (activeTab === 'leaderboard') {
      fetchUsers();
    }
  }, [activeTab]);

  // 计算统计数据
  const stats = useMemo(() => {
    const totalEarned = pointHistory
      .filter(p => p.type === 'earn')
      .reduce((sum, p) => sum + p.amount, 0);

    const totalSpent = pointHistory
      .filter(p => p.type === 'spend')
      .reduce((sum, p) => sum + p.amount, 0);

    const activeDays = pointHistory.length;
    const currentLevel = Object.entries(LEVEL_CONFIG)
      .reverse()
      .find(([, config]) => user.reputation >= config.min)?.[0] || 'newstar';

    // 计算下一等级所需积分
    const levelEntries = Object.entries(LEVEL_CONFIG);
    const currentLevelIndex = levelEntries.findIndex(([key]) => key === currentLevel);
    const nextLevel = levelEntries[currentLevelIndex + 1];
    const progressToNext = nextLevel
      ? ((user.reputation - LEVEL_CONFIG[currentLevel as keyof typeof LEVEL_CONFIG].min) /
          (nextLevel[1].min - LEVEL_CONFIG[currentLevel as keyof typeof LEVEL_CONFIG].min)) * 100
      : 100;

    return {
      totalEarned,
      totalSpent,
      activeDays,
      currentLevel,
      progressToNext: Math.min(100, Math.max(0, progressToNext)),
    };
  }, [pointHistory, user.reputation]);

  // 排行榜数据 - 声望降序，同声望按名字首字母排序
  const leaderboard = useMemo(() => {
    return [...dbUsers].sort((a, b) => {
      // 首先按声望降序
      if (b.reputation !== a.reputation) {
        return b.reputation - a.reputation;
      }
      // 声望相同时按名字首字母升序排序
      return a.name.localeCompare(b.name, 'zh-CN');
    });
  }, [dbUsers]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">我的声望</h1>
          <p className="text-slate-500 mt-1">查看积分获取记录和排行榜</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 当前能量 */}
        <Card padding="md" className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-bl-full opacity-10" />
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Sparkles className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">能量值</p>
              <p className="text-2xl font-bold text-slate-900">{user.energy.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        {/* 声望等级 */}
        <Card padding="md" className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-bl-full opacity-10" />
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Trophy className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">声望等级</p>
              <p className="text-lg font-bold" style={{ color: LEVEL_CONFIG[stats.currentLevel as keyof typeof LEVEL_CONFIG]?.color }}>
                {LEVEL_CONFIG[stats.currentLevel as keyof typeof LEVEL_CONFIG]?.name}
              </p>
            </div>
          </div>
        </Card>

        {/* 总获积分 */}
        <Card padding="md" className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-bl-full opacity-10" />
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">累计获得</p>
              <p className="text-2xl font-bold text-emerald-600">+{stats.totalEarned.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        {/* 活跃天数 */}
        <Card padding="md" className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-rose-400 to-pink-500 rounded-bl-full opacity-10" />
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 rounded-lg">
              <Flame className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">活跃天数</p>
              <p className="text-2xl font-bold text-slate-900">{stats.activeDays}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Level Progress */}
      <Card padding="md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            <span className="font-medium text-slate-900">等级进度</span>
          </div>
          <span className="text-sm text-slate-500">
            {user.reputation.toLocaleString()} / {
              Object.entries(LEVEL_CONFIG)
                .reverse()
                [Object.keys(LEVEL_CONFIG).indexOf(stats.currentLevel) + 1]?.[1]?.min.toLocaleString() || 'MAX'
            }
          </span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${stats.progressToNext}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-500">
          <span>{LEVEL_CONFIG[stats.currentLevel as keyof typeof LEVEL_CONFIG]?.name}</span>
          <span>{LEVEL_CONFIG[Object.keys(LEVEL_CONFIG)[Object.keys(LEVEL_CONFIG).indexOf(stats.currentLevel) + 1] as keyof typeof LEVEL_CONFIG]?.name || '最高等级'}</span>
        </div>
      </Card>

      {/* Contribution Graph */}
      <Card padding="md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-600" />
            <span className="font-medium text-slate-900">探索热力图</span>
          </div>
          <span className="text-sm text-slate-500">过去一年</span>
        </div>
        <ContributionGraph activities={dailyActivities} />
      </Card>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-4">
          {[
            { id: 'leaderboard', label: '声望排行', icon: Trophy },
            { id: 'history', label: '积分记录', icon: Clock },
            { id: 'rules', label: '获取规则', icon: Target },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-1 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'history' && (
        <Card padding="none">
          <div className="divide-y divide-slate-100">
            {pointHistory.length === 0 ? (
              <div className="text-center py-12">
                <Award className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-600 mb-2">暂无积分记录</h3>
                <p className="text-sm text-slate-400">开始互动来获取积分吧！</p>
              </div>
            ) : (
              pointHistory.slice(0, 50).map(record => (
                <div key={record.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      record.type === 'earn' ? 'bg-emerald-100' : 'bg-rose-100'
                    }`}>
                      {record.type === 'earn' ? (
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4 text-rose-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{getReasonDesc(record.reason)}</p>
                      {record.sourceTitle && (
                        <p className="text-sm text-slate-500 truncate max-w-[200px]">{record.sourceTitle}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${
                      record.type === 'earn' ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {record.type === 'earn' ? '+' : '-'}{record.amount}
                    </p>
                    <p className="text-xs text-slate-400">{formatTimeAgo(record.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {activeTab === 'leaderboard' && (
        <div className="space-y-4">
          {/* Header for weekly ranking */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-slate-900">本周声望排行</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500">
                {dbUsers.length} 位成员
              </span>
              <button
                onClick={fetchUsers}
                className="text-xs text-indigo-600 hover:text-indigo-700"
                disabled={isLoadingUsers}
              >
                {isLoadingUsers ? '刷新中...' : '刷新'}
              </button>
            </div>
          </div>

          {/* Error message */}
          {loadError && (
            <Card padding="md" className="bg-red-50 border-red-200">
              <p className="text-sm text-red-600">加载失败: {loadError}</p>
              <button
                onClick={fetchUsers}
                className="mt-2 text-xs text-red-600 underline"
              >
                点击重试
              </button>
            </Card>
          )}

          {/* Loading state */}
          {isLoadingUsers && (
            <Card padding="md" className="text-center">
              <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-slate-500">正在加载用户数据...</p>
            </Card>
          )}

          {/* Top 3 Podium */}
          {!isLoadingUsers && !loadError && leaderboard.length >= 3 && (
            <Card padding="md">
              <div className="flex items-end justify-center gap-4 py-4">
                {/* 2nd place */}
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <Avatar name={leaderboard[1].name} size="lg" />
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-slate-300 rounded-full flex items-center justify-center">
                      <Medal className="w-4 h-4 text-slate-600" />
                    </div>
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-700">{leaderboard[1].name}</p>
                  <p className="text-xs text-slate-500">{leaderboard[1].reputation.toLocaleString()}</p>
                  <div className="w-16 h-20 bg-gradient-to-t from-slate-200 to-slate-300 rounded-t-lg mt-2 flex items-center justify-center">
                    <span className="text-2xl font-bold text-slate-600">2</span>
                  </div>
                </div>

                {/* 1st place */}
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <Avatar name={leaderboard[0].name} size="lg" />
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center">
                      <Crown className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <p className="mt-2 text-sm font-bold text-amber-600">{leaderboard[0].name}</p>
                  <p className="text-xs text-amber-600">{leaderboard[0].reputation.toLocaleString()}</p>
                  <div className="w-20 h-24 bg-gradient-to-t from-amber-400 to-amber-500 rounded-t-lg mt-2 flex items-center justify-center shadow-lg">
                    <span className="text-3xl font-bold text-white">1</span>
                  </div>
                </div>

                {/* 3rd place */}
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <Avatar name={leaderboard[2].name} size="lg" />
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-300 rounded-full flex items-center justify-center">
                      <Medal className="w-4 h-4 text-orange-700" />
                    </div>
                  </div>
                  <p className="mt-2 text-sm font-medium text-orange-600">{leaderboard[2].name}</p>
                  <p className="text-xs text-slate-500">{leaderboard[2].reputation.toLocaleString()}</p>
                  <div className="w-16 h-16 bg-gradient-to-t from-orange-300 to-orange-400 rounded-t-lg mt-2 flex items-center justify-center">
                    <span className="text-2xl font-bold text-orange-700">3</span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Full ranking list */}
          {!isLoadingUsers && !loadError && (
            <Card padding="none">
              <div className="divide-y divide-slate-100">
                {leaderboard.length === 0 ? (
                  <div className="text-center py-12">
                    <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">暂无排行数据</p>
                    <p className="text-sm text-slate-400 mt-1">请先在管理员后台添加用户</p>
                  </div>
                ) : (
                  leaderboard.map((u, index) => (
                    <div
                      key={u.id}
                      className={`flex items-center justify-between p-4 hover:bg-slate-50 transition-colors ${
                        u.id === user.id ? 'bg-indigo-50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${
                          index === 0 ? 'bg-amber-100 text-amber-600' :
                          index === 1 ? 'bg-slate-200 text-slate-600' :
                          index === 2 ? 'bg-orange-100 text-orange-600' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {index + 1}
                        </div>
                        <Avatar name={u.name} size="sm" />
                        <div>
                          <p className="font-medium text-slate-900 flex items-center gap-2">
                            {u.name}
                            {u.id === user.id && <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-600 text-xs rounded">我</span>}
                          </p>
                          <p className="text-sm text-slate-500">{u.department}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900">{u.reputation.toLocaleString()}</p>
                        <p className="text-xs text-slate-500">声望</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'rules' && (
        <Card padding="none">
          <div className="divide-y divide-slate-100">
            {Object.entries(POINT_RULES).map(([key, rule]) => (
              <div key={key} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    rule.earn > 0 ? 'bg-emerald-100' : rule.earn < 0 ? 'bg-rose-100' : 'bg-slate-100'
                  }`}>
                    {rule.earn > 0 ? (
                      <Zap className="w-4 h-4 text-emerald-600" />
                    ) : rule.earn < 0 ? (
                      <ArrowUpRight className="w-4 h-4 text-rose-600" />
                    ) : (
                      <Target className="w-4 h-4 text-slate-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{rule.desc}</p>
                    <p className="text-xs text-slate-400">
                      {rule.earn > 0 ? `+${rule.earn} 积分` :
                       rule.earn < 0 ? `${rule.earn} 积分` :
                       '自定义'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
