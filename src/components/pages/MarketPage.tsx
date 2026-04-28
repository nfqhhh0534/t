import React, { useState } from 'react';
import { Search, Filter, Plus, Package, Star, Eye, Clock, Heart, Bookmark } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Card, CardHeader, CardTitle, Avatar, Tag, Button, Input } from '@/components/ui';
import { products } from '@/data/mockData';
import { formatTimeAgo, formatNumber, getProductCategoryInfo } from '@/utils';

export function MarketPage() {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = products.filter((p) => {
    if (activeTab === 'all') return true;
    return p.category === activeTab;
  }).filter((p) => {
    if (searchQuery) {
      return p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             p.content.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const tabs = [
    { id: 'all', label: '全部分享' },
    { id: 'aitool', label: 'AI工具' },
    { id: 'dataset', label: '数据集' },
    { id: 'course', label: '课程资源' },
    { id: 'merchandise', label: '实物周边' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-7 h-7 text-indigo-600" />
            极客百宝箱
          </h1>
          <p className="text-slate-500 mt-1">分享你的AI工具、数据集、课程资源，让知识流动起来</p>
        </div>
        <Button>
          <Plus className="w-4 h-4" />
          发布分享
        </Button>
      </div>

      {/* Tabs & Search */}
      <Card padding="sm">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-indigo-100 text-indigo-600'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="w-full lg:w-64">
            <Input
              placeholder="搜索分享..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
        </div>
      </Card>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => {
          const category = getProductCategoryInfo(product.category);
          return (
            <Card key={product.id} hover className="group cursor-pointer overflow-hidden">
              {/* Product Image */}
              <div className="relative h-36 -mx-4 -mt-4 mb-4 bg-gradient-to-br from-indigo-500 via-cyan-500 to-purple-500">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-5xl">{category.icon}</span>
                </div>
                <div className="absolute top-3 left-3">
                  <span className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-xs text-white font-medium">
                    {category.label}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                  {product.title}
                </h3>

                {/* Author */}
                <div className="flex items-center gap-2 mb-3">
                  <Avatar name={product.author.name} size="xs" />
                  <div>
                    <span className="text-xs font-medium text-slate-700">{product.author.name}</span>
                    <span className="text-xs text-slate-400 ml-1">{product.author.title}</span>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${i < Math.floor(product.rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-slate-500">{product.rating} ({product.reviews}评价)</span>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <button className="flex items-center gap-1 text-slate-500 hover:text-red-500 transition-colors">
                      <Heart className="w-4 h-4" />
                      <span className="text-sm">{product.likes}</span>
                    </button>
                    <button className="flex items-center gap-1 text-slate-500 hover:text-indigo-500 transition-colors">
                      <Bookmark className="w-4 h-4" />
                      <span className="text-sm">收藏</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-1 text-indigo-600 font-medium text-sm">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    {product.rating}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <Card className="text-center py-12">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-600 mb-2">暂无相关分享</h3>
          <p className="text-sm text-slate-400 mb-4">成为第一个分享的人</p>
          <Button>发布分享</Button>
        </Card>
      )}

      {/* Categories Banner */}
      <Card padding="none">
        <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-slate-100">
          {tabs.filter(t => t.id !== 'all').map((tab) => (
            <div key={tab.id} className="p-4 text-center hover:bg-slate-50 transition-colors cursor-pointer">
              <div className="text-2xl mb-2">
                {tab.id === 'aitool' ? '🤖' : tab.id === 'dataset' ? '📊' : tab.id === 'course' ? '📚' : '🎁'}
              </div>
              <div className="font-medium text-sm text-slate-700">{tab.label}</div>
              <div className="text-xs text-slate-400 mt-1">
                {products.filter(p => p.category === tab.id).length} 个分享
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Hot Products */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">热门分享推荐</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.slice(0, 2).map((product) => {
            const category = getProductCategoryInfo(product.category);
            return (
              <Card key={product.id} hover className="group cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-cyan-100 rounded-xl flex items-center justify-center text-3xl shrink-0">
                    {category.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">
                      {product.title}
                    </h3>
                    <p className="text-sm text-slate-500 line-clamp-2 mb-2">{product.excerpt || product.content.slice(0, 100)}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {product.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {product.rating}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {formatNumber(product.views)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
