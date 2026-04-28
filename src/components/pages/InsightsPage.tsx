import React, { useState } from 'react';
import { Search, Filter, Plus, Lightbulb, Clock, Eye, Star, Sparkles, BookOpen, Newspaper, Layers, X, Database } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Card, CardHeader, CardTitle, Avatar, Tag, Button, StatusBadge, Input } from '@/components/ui';
import { insights as mockInsights, tags } from '@/data/mockData';
import { formatTimeAgo, formatNumber, getInsightCategoryInfo } from '@/utils';

export function InsightsPage() {
  const { state, dispatch, createInsight } = useApp();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formExcerpt, setFormExcerpt] = useState('');
  const [formCategory, setFormCategory] = useState('tech');
  const [formSourceUrl, setFormSourceUrl] = useState('');

  // Reset form
  const resetForm = () => {
    setFormTitle('');
    setFormContent('');
    setFormExcerpt('');
    setFormCategory('tech');
    setFormSourceUrl('');
  };

  // Open modal
  const openModal = () => {
    resetForm();
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!formTitle.trim()) {
      alert('请输入标题');
      return;
    }
    if (!formContent.trim()) {
      alert('请输入内容');
      return;
    }

    // Validate URL if provided
    if (formSourceUrl.trim() && !isValidUrl(formSourceUrl.trim())) {
      alert('请输入有效的链接地址');
      return;
    }

    setIsSubmitting(true);

    try {
      await createInsight({
        title: formTitle.trim(),
        content: formContent.trim(),
        excerpt: formExcerpt.trim() || formContent.trim().substring(0, 100) + '...',
        category: formCategory,
        source_url: formSourceUrl.trim() || undefined,
      });

      alert('见解发布成功！');
      closeModal();
    } catch (error) {
      console.error('Failed to create insight:', error);
      alert('发布失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // URL validation helper
  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const filteredInsights = state.insights.filter((i: any) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'editorPick') return i.editorPick;
    return i.category === activeTab;
  }).filter((i: any) => {
    if (searchQuery) {
      return i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             i.content.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const tabs = [
    { id: 'all', label: '全部', icon: <Layers className="w-4 h-4" /> },
    { id: 'industry', label: '行业资讯', icon: <Newspaper className="w-4 h-4" /> },
    { id: 'tech', label: '技术博文', icon: <Lightbulb className="w-4 h-4" /> },
    { id: 'topic', label: '专题策划', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'book', label: '读书笔记', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'editorPick', label: '编辑精选', icon: <Sparkles className="w-4 h-4" /> },
  ];

  const categories = [
    { id: 'industry', label: '行业资讯', emoji: '📰' },
    { id: 'tech', label: '技术博文', emoji: '💻' },
    { id: 'topic', label: '专题策划', emoji: '✨' },
    { id: 'book', label: '读书笔记', emoji: '📚' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Lightbulb className="w-7 h-7 text-indigo-600" />
            见闻洞察
          </h1>
          <p className="text-slate-500 mt-1">行业资讯、技术博文、专题策划，信息噪音过滤机</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
            state.isDbConnected
              ? 'bg-emerald-100 text-emerald-600'
              : 'bg-amber-100 text-amber-600'
          }`}>
            <Database className="w-3.5 h-3.5" />
            {state.isDbConnected ? '数据库已连接' : '本地模式'}
          </div>
          <Button onClick={openModal}>
            <Plus className="w-4 h-4" />
            发布见解
          </Button>
        </div>
      </div>

      {/* Weekly Editor */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center text-white text-xl">
            📰
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-slate-900">本周轮值编辑</h3>
              <StatusBadge status="featured" />
            </div>
            <p className="text-sm text-slate-600">
              本周邀请<strong>李思远</strong>担任轮值编辑，负责从日常讨论和外部资讯中挑选3-5条精选内容进行点评发布。
            </p>
          </div>
          <Avatar name="李思远" size="lg" />
        </div>
      </Card>

      {/* Tabs & Search */}
      <Card padding="sm">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-indigo-100 text-indigo-600'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="w-full lg:w-64">
            <Input
              placeholder="搜索见闻..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
        </div>
      </Card>

      {/* Featured Content */}
      {activeTab === 'all' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredInsights.slice(0, 2).map((insight) => {
            const category = getInsightCategoryInfo(insight.category);
            return (
              <Card key={insight.id} hover className="group cursor-pointer">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="w-full sm:w-32 h-24 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-xl flex items-center justify-center text-4xl shrink-0">
                    {insight.category === 'industry' ? '📰' : insight.category === 'tech' ? '💻' : '📚'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Tag color={category.color} size="sm">{category.label}</Tag>
                      {insight.editorPick && <StatusBadge status="featured" />}
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {insight.title}
                    </h3>
                    <p className="text-sm text-slate-500 line-clamp-2 mb-3">{insight.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar name={insight.author.name} size="xs" />
                        <span className="text-xs text-slate-500">{insight.author.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {formatNumber(insight.views)}
                        </span>
                        <span>{formatTimeAgo(insight.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Insights List */}
      <div className="space-y-4">
        {filteredInsights.map((insight) => {
          const category = getInsightCategoryInfo(insight.category);
          return (
            <Card key={insight.id} hover className="group cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center text-2xl shrink-0 hidden sm:flex">
                  {insight.category === 'industry' ? '📰' : insight.category === 'tech' ? '💻' : insight.category === 'book' ? '📚' : '✨'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Tag color={category.color} size="sm">{category.label}</Tag>
                    {insight.editorPick && <StatusBadge status="featured" />}
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {insight.title}
                  </h3>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-3">{insight.excerpt}</p>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={insight.author.name} size="sm" />
                      <div>
                        <span className="text-sm font-medium text-slate-700">{insight.author.name}</span>
                        <span className="text-sm text-slate-400 ml-2">{insight.author.department}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        {insight.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {formatNumber(insight.views)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(insight.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredInsights.length === 0 && (
        <Card className="text-center py-12">
          <Lightbulb className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-600 mb-2">暂无相关见闻</h3>
          <p className="text-sm text-slate-400 mb-4">成为第一个分享见解的人</p>
          <Button onClick={openModal}>发布见解</Button>
        </Card>
      )}

      {/* Publish Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-cyan-50">
              <h2 className="text-lg font-semibold text-slate-900">发布见解</h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
              {/* Title Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  标题 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="请输入见解标题，例如：2024年AI领域十大趋势预测"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-slate-900"
                  maxLength={100}
                />
              </div>

              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  分类 <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-3">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setFormCategory(cat.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all ${
                        formCategory === cat.id
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <span>{cat.emoji}</span>
                      <span className="font-medium">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Excerpt Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  摘要
                  <span className="text-xs text-slate-400 ml-2">(可选，将自动截取内容前100字)</span>
                </label>
                <textarea
                  value={formExcerpt}
                  onChange={(e) => setFormExcerpt(e.target.value)}
                  placeholder="请输入简要摘要，方便在列表中展示..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none text-slate-900"
                  rows={2}
                  maxLength={200}
                />
              </div>

              {/* Content Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  内容 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="请输入详细内容..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none text-slate-900"
                  rows={8}
                  maxLength={5000}
                />
                <div className="flex justify-end mt-1">
                  <span className="text-xs text-slate-400">{formContent.length}/5000</span>
                </div>
              </div>

              {/* Source URL Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  来源链接
                  <span className="text-xs text-slate-400 ml-2">(可选，粘贴文章或视频链接)</span>
                </label>
                <input
                  type="url"
                  value={formSourceUrl}
                  onChange={(e) => setFormSourceUrl(e.target.value)}
                  placeholder="https://example.com/article"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-slate-900"
                />
                <p className="text-xs text-slate-400 mt-1">
                  支持粘贴外部文章、视频等链接
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200 bg-slate-50">
              <Button variant="secondary" onClick={closeModal} disabled={isSubmitting}>
                取消
              </Button>
              <Button
                onClick={handleSubmit}
                isLoading={isSubmitting}
                disabled={isSubmitting || !formTitle.trim() || !formContent.trim()}
              >
                {isSubmitting ? '发布中...' : '发布见解'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
