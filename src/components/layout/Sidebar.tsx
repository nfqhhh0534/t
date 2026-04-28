import React from 'react';
import { Home, MessageCircleQuestion, Bot, Lightbulb, Package, User, TrendingUp, Award, Sparkles } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { NavSection } from '@/types';
import { Avatar, LevelBadge, Tag } from '@/components/ui';
import { AICompassWidget } from '@/components/ui/AICompass';
import { getLevelNumber, formatNumber } from '@/utils';
import { tags } from '@/data/mockData';

const navItems: { id: NavSection; label: string; icon: React.ReactNode }[] = [
  { id: 'home', label: '首页', icon: <Home className="w-5 h-5" /> },
  { id: 'ask', label: '所有人问所有人', icon: <MessageCircleQuestion className="w-5 h-5" /> },
  { id: 'aihub', label: 'AI Hub', icon: <Bot className="w-5 h-5" /> },
  { id: 'insights', label: '见闻洞察', icon: <Lightbulb className="w-5 h-5" /> },
  { id: 'market', label: '极客百宝箱', icon: <Package className="w-5 h-5" /> },
];

interface SidebarProps {
  onOpenAICompass?: () => void;
}

export function Sidebar({ onOpenAICompass }: SidebarProps) {
  const { state, dispatch } = useApp();
  const { user } = state;

  return (
    <aside className="hidden lg:block w-60 shrink-0">
      <div className="sticky top-20 space-y-6">
        {/* User Profile Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Avatar name={user.name} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 truncate">{user.name}</span>
                {user.isExpert && <span className="text-xs">🔥</span>}
              </div>
              <p className="text-sm text-slate-500 truncate">{user.department} · {user.title}</p>
            </div>
          </div>

          <LevelBadge level={user.level} showNumber={getLevelNumber(user.energy)} />

          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100">
            <div className="text-center">
              <div className="text-lg font-semibold text-slate-900">{user.answers}</div>
              <div className="text-xs text-slate-500">回答</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-slate-900">{formatNumber(user.likes)}</div>
              <div className="text-xs text-slate-500">获赞</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-indigo-600">{formatNumber(user.energy)}</div>
              <div className="text-xs text-slate-500">能量</div>
            </div>
          </div>
        </div>

        {/* AI Compass Widget */}
        <AICompassWidget onOpen={onOpenAICompass || (() => {})} />

        {/* Navigation */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => dispatch({ type: 'SET_SECTION', payload: item.id })}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                state.currentSection === item.id
                  ? 'bg-indigo-50 text-indigo-600 border-l-2 border-indigo-600'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
          <button
            onClick={() => dispatch({ type: 'SET_SECTION', payload: 'profile' })}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-t border-slate-100 ${
              state.currentSection === 'profile'
                ? 'bg-indigo-50 text-indigo-600 border-l-2 border-indigo-600'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="font-medium">个人中心</span>
          </button>
        </div>

        {/* Hot Tags */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-orange-500" />
            <h3 className="font-semibold text-slate-900">热门标签</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.slice(0, 8).map((tag) => (
              <Tag key={tag.id} color={tag.color} size="sm">
                {tag.name}
              </Tag>
            ))}
          </div>
        </div>

        {/* AI Assistant Quick Access */}
        <button
          onClick={() => dispatch({ type: 'TOGGLE_AI_ASSISTANT' })}
          className="w-full bg-gradient-to-r from-indigo-600 to-cyan-500 rounded-xl p-4 text-white shadow-lg hover:shadow-xl transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="font-semibold">AI 课代表</div>
              <div className="text-sm text-white/80">智能摘要 · 语义搜索</div>
            </div>
          </div>
        </button>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const { state, dispatch } = useApp();

  const navItems: { id: NavSection; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: '首页', icon: <Home className="w-5 h-5" /> },
    { id: 'ask', label: '问答', icon: <MessageCircleQuestion className="w-5 h-5" /> },
    { id: 'aihub', label: 'AI Hub', icon: <Bot className="w-5 h-5" /> },
    { id: 'insights', label: '见闻', icon: <Lightbulb className="w-5 h-5" /> },
    { id: 'profile', label: '我的', icon: <User className="w-5 h-5" /> },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 pb-safe">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => dispatch({ type: 'SET_SECTION', payload: item.id })}
            className={`flex flex-col items-center gap-1 px-3 py-2 ${
              state.currentSection === item.id
                ? 'text-indigo-600'
                : 'text-slate-400'
            }`}
          >
            {item.icon}
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
