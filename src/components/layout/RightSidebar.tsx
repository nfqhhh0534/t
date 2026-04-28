import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, Target, Sparkles, TrendingUp } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Avatar, Card, CardHeader, CardTitle } from '@/components/ui';
import { profilesApi, DbUser } from '@/services/supabase';
import { formatNumber } from '@/utils';

export function RightSidebar() {
  const { state, dispatch } = useApp();

  // Database users for ranking
  const [dbUsers, setDbUsers] = useState<DbUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch users from database
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersData = await profilesApi.getAll();
        console.log('RightSidebar - Fetched users from database:', usersData);
        // Filter out users with null reputation and set default 2000 if not set
        const usersWithReputation = (usersData || []).map(u => ({
          ...u,
          reputation: u.reputation ?? 2000
        }));
        console.log('RightSidebar - Processed users with reputation:', usersWithReputation);
        setDbUsers(usersWithReputation);
      } catch (error) {
        console.error('RightSidebar - Failed to fetch users:', error);
        // Fallback to empty array, show no data
        setDbUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Sort users by reputation (descending), then by name (ascending for same reputation)
  const sortedUsers = useMemo(() => {
    return [...dbUsers].sort((a, b) => {
      if (b.reputation !== a.reputation) {
        return b.reputation - a.reputation;
      }
      return a.name.localeCompare(b.name, 'zh-CN');
    });
  }, [dbUsers]);

  // Take top 5 for the leaderboard
  const topUsers = sortedUsers.slice(0, 5);

  return (
    <aside className="hidden xl:block w-80 shrink-0">
      <div className="sticky top-20 space-y-6">
        {/* Weekly Leaderboard */}
        <Card padding="none">
          <CardHeader className="p-4 border-b border-slate-100">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              本周声望排行
            </CardTitle>
          </CardHeader>
          <div className="divide-y divide-slate-100">
            {isLoading ? (
              <div className="p-4 text-center text-slate-500">
                <div className="animate-pulse">加载中...</div>
              </div>
            ) : topUsers.length === 0 ? (
              <div className="p-4 text-center text-slate-500">
                暂无排行数据
              </div>
            ) : (
              topUsers.map((user, index) => (
                <div key={user.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                  <div className={`w-6 h-6 flex items-center justify-center rounded-full font-bold text-sm ${
                    index === 0 ? 'bg-amber-100 text-amber-600' :
                    index === 1 ? 'bg-slate-200 text-slate-600' :
                    index === 2 ? 'bg-orange-100 text-orange-600' :
                    'text-slate-400'
                  }`}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                  </div>
                  <Avatar name={user.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 truncate">{user.name}</div>
                    <div className="text-xs text-slate-500">{user.department}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-indigo-600">{formatNumber(user.reputation)}</div>
                    <div className="text-xs text-slate-400">声望</div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-3 border-t border-slate-100">
            <button
              onClick={() => dispatch({ type: 'SET_SECTION', payload: 'points' })}
              className="w-full text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer"
            >
              查看完整排行 →
            </button>
          </div>
        </Card>

        {/* Expert Recommendations */}
        <Card padding="none">
          <CardHeader className="p-4 border-b border-slate-100">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-500" />
              推荐关注
            </CardTitle>
          </CardHeader>
          <div className="divide-y divide-slate-100">
            {topUsers.slice(0, 3).map((user) => (
              <div key={user.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                <Avatar name={user.name} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900 truncate">{user.name}</span>
                  </div>
                  <div className="text-sm text-slate-500 truncate">{user.position || '社区成员'}</div>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs px-1.5 py-0.5 bg-slate-100 rounded text-slate-500">
                      {user.department}
                    </span>
                  </div>
                </div>
                <button className="px-3 py-1.5 text-xs font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors">
                  +关注
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* Daily Challenge */}
        <Card className="bg-gradient-to-br from-indigo-500 to-cyan-500 border-none text-white">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">每日挑战</h3>
              <p className="text-sm text-white/80 mb-3">完成每日任务获取额外能量值奖励</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="w-4 h-4 rounded border-white/30 bg-white/20" />
                  <span className="text-sm">点赞3篇内容</span>
                  <span className="ml-auto text-sm bg-white/20 px-2 py-0.5 rounded">+10</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="w-4 h-4 rounded border-white/30 bg-white/20" />
                  <span className="text-sm">发布一个问题</span>
                  <span className="ml-auto text-sm bg-white/20 px-2 py-0.5 rounded">+20</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <Card padding="none">
          <div className="grid grid-cols-2 divide-x divide-slate-100">
            <div className="p-4 text-center">
              <TrendingUp className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
              <div className="text-xl font-bold text-slate-900">+{formatNumber(state.user.energy)}</div>
              <div className="text-xs text-slate-500">我的能量</div>
            </div>
            <div className="p-4 text-center">
              <Trophy className="w-5 h-5 text-amber-500 mx-auto mb-2" />
              <div className="text-xl font-bold text-slate-900">{formatNumber(state.user.reputation)}</div>
              <div className="text-xs text-slate-500">我的声望</div>
            </div>
          </div>
        </Card>
      </div>
    </aside>
  );
}
