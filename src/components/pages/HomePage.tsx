import React, { useState, useEffect } from 'react';
import { MessageCircleQuestion, Bot, Lightbulb, Gift, TrendingUp, Users, Zap, ChevronRight, Sparkles, Loader2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Card, CardHeader, CardTitle, Avatar, Tag, Button, StatusBadge } from '@/components/ui';
import { formatTimeAgo, formatNumber, getInsightCategoryInfo } from '@/utils';
import { profilesApi } from '@/services/supabase';

interface CommunityStats {
  totalUsers: number;
  totalEnergy: number;
  totalQuestions: number;
  totalProjects: number;
}

export function HomePage() {
  const { state, dispatch } = useApp();
  const { user, questions, projects, insights } = state;
  const [stats, setStats] = useState<CommunityStats>({
    totalUsers: 0,
    totalEnergy: 0,
    totalQuestions: 0,
    totalProjects: 0,
  });
  const [loading, setLoading] = useState(true);

  // 获取真实统计数据
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 从 profiles 表获取用户数和总能量值
        const profiles = await profilesApi.getAll();
        const totalUsers = profiles?.length || 0;
        const totalEnergy = profiles?.reduce((sum: number, p: any) => sum + (p.energy || 0), 0) || 0;

        setStats({
          totalUsers,
          totalEnergy,
          totalQuestions: questions.length,
          totalProjects: projects.length,
        });
      } catch (error) {
        console.error('Failed to fetch community stats:', error);
        // 如果获取失败，使用本地 state 数据
        setStats({
          totalUsers: 1,
          totalEnergy: user.energy,
          totalQuestions: questions.length,
          totalProjects: projects.length,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [questions.length, projects.length, user.energy]);

  // 计算板块数量
  const features = [
    {
      id: 'ask',
      icon: <MessageCircleQuestion className="w-6 h-6" />,
      title: '所有人问所有人',
      description: '向社区任意专家提问，获得精准解答',
      gradient: 'from-blue-500 to-indigo-500',
      count: questions.length,
    },
    {
      id: 'aihub',
      icon: <Bot className="w-6 h-6" />,
      title: 'AI Hub',
      description: 'AI项目展厅，展示落地成果',
      gradient: 'from-cyan-500 to-blue-500',
      count: projects.length,
    },
    {
      id: 'insights',
      icon: <Lightbulb className="w-6 h-6" />,
      title: '见闻洞察',
      description: '行业资讯、技术博文、专题策划',
      gradient: 'from-purple-500 to-pink-500',
      count: insights.length,
    },
    {
      id: 'market',
      icon: <Gift className="w-6 h-6" />,
      title: '极客百宝箱',
      description: 'AI工具、数据集、课程资源',
      gradient: 'from-orange-500 to-amber-500',
      count: 156, // 好物暂时使用 mock 数据
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-cyan-600 rounded-2xl p-8 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-cyan-300 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-sm text-white/80">企业内部AI知识共享平台</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">连接智慧，共创未来</h1>
          <p className="text-lg text-white/80 max-w-2xl mb-6">
            汇聚企业内部AI专家与爱好者，打造知识共享、协作创新、价值变现的智能化社区平台。
          </p>
          <div className="flex flex-wrap gap-4">
            <Button
              variant="secondary"
              className="bg-white text-indigo-600 hover:bg-white/90 border-0"
              onClick={() => dispatch({ type: 'SET_SECTION', payload: 'ask' })}
            >
              探索社区
            </Button>
            <Button
              variant="ghost"
              className="text-white hover:bg-white/10"
            >
              了解更多
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Users className="w-5 h-5 text-indigo-500" />
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-8">
              <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
            </div>
          ) : (
            <div className="text-2xl font-bold text-slate-900">{formatNumber(stats.totalUsers)}</div>
          )}
          <div className="text-sm text-slate-500">社区成员</div>
        </Card>
        <Card className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <MessageCircleQuestion className="w-5 h-5 text-cyan-500" />
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-8">
              <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
            </div>
          ) : (
            <div className="text-2xl font-bold text-slate-900">{formatNumber(stats.totalQuestions)}</div>
          )}
          <div className="text-sm text-slate-500">精彩问答</div>
        </Card>
        <Card className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Bot className="w-5 h-5 text-purple-500" />
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-8">
              <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
            </div>
          ) : (
            <div className="text-2xl font-bold text-slate-900">{formatNumber(stats.totalProjects)}</div>
          )}
          <div className="text-sm text-slate-500">AI项目</div>
        </Card>
        <Card className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-orange-500" />
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-8">
              <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
            </div>
          ) : (
            <div className="text-2xl font-bold text-slate-900">{formatNumber(stats.totalEnergy)}</div>
          )}
          <div className="text-sm text-slate-500">总能量值</div>
        </Card>
      </div>

      {/* Feature Cards */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">四大核心板块</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature) => (
            <Card
              key={feature.id}
              hover
              className="group cursor-pointer"
              onClick={() => dispatch({ type: 'SET_SECTION', payload: feature.id as any })}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                {feature.icon}
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">{feature.title}</h3>
              <p className="text-sm text-slate-500 mb-3">{feature.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{feature.count} 个内容</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Questions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">最新问答</h2>
          <Button variant="ghost" size="sm" onClick={() => dispatch({ type: 'SET_SECTION', payload: 'ask' })}>
            查看更多 <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <Card padding="none">
          {questions.slice(0, 3).map((question, index) => (
            <div
              key={question.id}
              className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors ${index !== 0 ? 'border-t border-slate-100' : ''}`}
            >
              <div className="flex items-start gap-4">
                <Avatar name={question.author.name} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {question.tags.slice(0, 2).map((tag) => (
                      <Tag key={tag.id} color={tag.color} size="sm">{tag.name}</Tag>
                    ))}
                    {question.status === 'resolved' && <StatusBadge status="resolved" />}
                    {question.bounty && question.bounty > 0 && (
                      <span className="text-xs text-orange-500">+{question.bounty}能量悬赏</span>
                    )}
                  </div>
                  <h4 className="font-medium text-slate-900 mb-1 line-clamp-1">{question.title}</h4>
                  <p className="text-sm text-slate-500 line-clamp-1">{question.content}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                    <span>{question.author.name}</span>
                    <span className="flex items-center gap-1">
                      <MessageCircleQuestion className="w-3 h-3" /> {question.comments.length || 0}回答
                    </span>
                    <span>👁 {formatNumber(question.views)}</span>
                    <span>{formatTimeAgo(question.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Card>
      </div>

      {/* Featured Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">精选项目</h2>
          <Button variant="ghost" size="sm" onClick={() => dispatch({ type: 'SET_SECTION', payload: 'aihub' })}>
            查看更多 <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.filter(p => p.isFeatured).slice(0, 2).map((project) => (
            <Card key={project.id} hover className="group cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-xl flex items-center justify-center text-white text-2xl shrink-0">
                  🤖
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {project.tags.slice(0, 2).map((tag) => (
                      <Tag key={tag.id} color={tag.color} size="sm">{tag.name}</Tag>
                    ))}
                    <StatusBadge status="online" />
                  </div>
                  <h4 className="font-semibold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">{project.title}</h4>
                  <p className="text-sm text-slate-500 line-clamp-2">{project.excerpt}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="text-xs">
                      <span className="text-slate-500">技术评分</span>
                      <span className="ml-1 font-semibold text-indigo-600">{project.metrics.techScore}/100</span>
                    </div>
                    <div className="text-xs">
                      <span className="text-slate-500">覆盖用户</span>
                      <span className="ml-1 font-semibold text-slate-700">{formatNumber(project.metrics.users)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Editor Picks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            编辑精选
          </h2>
          <Button variant="ghost" size="sm" onClick={() => dispatch({ type: 'SET_SECTION', payload: 'insights' })}>
            查看更多 <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.filter(i => i.editorPick).slice(0, 2).map((insight) => {
            const category = getInsightCategoryInfo(insight.category);
            return (
              <Card key={insight.id} hover className="group cursor-pointer">
                <div className="flex items-center gap-2 mb-3">
                  <Tag color={category.color} size="sm">{category.label}</Tag>
                  {insight.editorPick && <StatusBadge status="featured" />}
                </div>
                <h4 className="font-semibold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                  {insight.title}
                </h4>
                <p className="text-sm text-slate-500 line-clamp-2 mb-3">{insight.excerpt}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar name={insight.author.name} size="xs" />
                    <span className="text-xs text-slate-500">{insight.author.name}</span>
                  </div>
                  <span className="text-xs text-slate-400">{formatTimeAgo(insight.createdAt)}</span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
