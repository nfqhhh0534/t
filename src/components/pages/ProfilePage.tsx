import React from 'react';
import { Settings, Edit3, Award, MessageCircleQuestion, Bot, Lightbulb, Gift, TrendingUp, Calendar, Star, Heart, Eye, Edit, Download } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Card, CardHeader, CardTitle, Avatar, Tag, Button, LevelBadge, ExpertBadge, BadgeDisplay } from '@/components/ui';
import { generateHeatmapData } from '@/data/mockData';
import { getLevelNumber, getNextLevelEnergy, formatNumber, getHeatmapColor } from '@/utils';
import { BADGE_DEFINITIONS } from '@/data/badges';

export function ProfilePage() {
  const { state } = useApp();
  const { user } = state;
  const levelNumber = getLevelNumber(user.energy);
  const nextLevelEnergy = getNextLevelEnergy(user.energy);
  const progress = Math.min((user.energy / nextLevelEnergy) * 100, 100);
  const heatmapData = generateHeatmapData();

  const stats = [
    { icon: <MessageCircleQuestion className="w-5 h-5" />, label: '提问', value: 23, color: 'text-blue-500' },
    { icon: <MessageCircleQuestion className="w-5 h-5" />, label: '回答', value: user.answers, color: 'text-cyan-500' },
    { icon: <Bot className="w-5 h-5" />, label: '项目', value: 5, color: 'text-purple-500' },
    { icon: <Lightbulb className="w-5 h-5" />, label: '见闻', value: 12, color: 'text-amber-500' },
    { icon: <Gift className="w-5 h-5" />, label: '好物', value: 3, color: 'text-orange-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-indigo-600 via-cyan-500 to-purple-600" />
        <div className="relative pt-16">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
            <Avatar name={user.name} size="xl" className="border-4 border-white shadow-lg" />
            <div className="flex-1 text-center sm:text-left mb-2">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
                {user.isExpert && <ExpertBadge />}
              </div>
              <p className="text-slate-500">{user.department} · {user.title}</p>
              {user.expertFields && (
                <div className="flex gap-2 mt-2 justify-center sm:justify-start">
                  {user.expertFields.map((field, i) => (
                    <Tag key={i} variant="primary" size="sm">{field}</Tag>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm">
                <Edit3 className="w-4 h-4" />
                编辑资料
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Level & Stats */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gradient-to-br from-indigo-50 to-cyan-50 rounded-xl">
              <LevelBadge level={user.level} showNumber={levelNumber} />
              <div className="mt-2">
                <div className="flex items-center justify-between text-sm text-slate-500 mb-1">
                  <span>距离升级</span>
                  <span className="font-medium text-indigo-600">{nextLevelEnergy - user.energy}</span>
                </div>
                <div className="h-2 bg-white rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl text-center">
              <div className="text-2xl font-bold text-indigo-600">{formatNumber(user.energy)}</div>
              <div className="text-sm text-slate-500">能量值</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl text-center">
              <div className="text-2xl font-bold text-slate-900">{formatNumber(user.likes)}</div>
              <div className="text-sm text-slate-500">获得点赞</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl text-center">
              <div className="text-2xl font-bold text-slate-900">Top 5%</div>
              <div className="text-sm text-slate-500">声望排名</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Activity Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-500" />
            贡献热力图
          </CardTitle>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-slate-200" /> 无
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: getHeatmapColor(1) }} /> 低
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: getHeatmapColor(3) }} /> 中
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: getHeatmapColor(5) }} /> 高
            </span>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <div className="flex gap-[3px] min-w-max">
            {heatmapData.slice(-52).map((day, i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-sm hover:ring-2 hover:ring-indigo-400 cursor-pointer transition-all"
                style={{ backgroundColor: getHeatmapColor(day.count) }}
                title={`${day.date}: ${day.count} 次活动`}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 text-sm text-slate-500">
          <span>总贡献：{heatmapData.reduce((acc, d) => acc + d.count, 0)} 次发布</span>
          <span>获得 {formatNumber(user.likes)} 赞 · 声望 +{formatNumber(user.energy)}</span>
        </div>
      </Card>

      {/* Stats by Category */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            内容统计
          </CardTitle>
        </CardHeader>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {stats.map((stat, i) => (
            <div key={i} className="text-center p-4 bg-slate-50 rounded-xl hover:bg-indigo-50 transition-colors cursor-pointer">
              <div className={`mx-auto w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 ${stat.color}`}>
                {stat.icon}
              </div>
              <div className="text-xl font-bold text-slate-900">{stat.value}</div>
              <div className="text-xs text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Badges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            成就徽章 ({user.badges.length}/{BADGE_DEFINITIONS.length})
          </CardTitle>
        </CardHeader>
        <div className="space-y-4">
          {/* 用户已解锁的徽章展示 */}
          {user.badges.length > 0 ? (
            <BadgeDisplay badges={user.badges} size="lg" maxDisplay={6} showLocked />
          ) : (
            <div className="text-center py-8">
              <div className="text-5xl mb-3 opacity-30">🎖️</div>
              <p className="text-slate-500">还没有解锁任何徽章</p>
              <p className="text-sm text-slate-400 mt-1">开始互动，解锁你的第一个徽章吧！</p>
            </div>
          )}

          {/* 徽章统计 */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-slate-500">
                已解锁 <span className="font-semibold text-amber-600">{user.badges.length}</span> 个
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500">
                距离全部解锁还差 <span className="font-semibold text-slate-600">{BADGE_DEFINITIONS.length - user.badges.length}</span> 个
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full">🥉 青铜</span>
              <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full">🥈 白银</span>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">🥇 黄金</span>
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full">💎 钻石</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>最近动态</CardTitle>
          <Button variant="ghost" size="sm">查看全部</Button>
        </CardHeader>
        <div className="space-y-4">
          {[
            { icon: <Heart className="w-4 h-4" />, action: '回答了问题', target: '如何优化RAG系统的检索质量？', time: '2小时前', color: 'text-red-500' },
            { icon: <Star className="w-4 h-4" />, action: '发布项目', target: '智能客服对话系统3.0', time: '1天前', color: 'text-amber-500' },
            { icon: <Edit className="w-4 h-4" />, action: '发布见闻', target: '构建企业级RAG系统的十大最佳实践', time: '3天前', color: 'text-indigo-500' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
              <div className={`w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center ${item.color}`}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-600">
                  <span className="font-medium text-slate-900">{user.name}</span> {item.action}
                </p>
                <p className="text-sm text-indigo-600 truncate">{item.target}</p>
              </div>
              <span className="text-xs text-slate-400">{item.time}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
