import React, { useState } from 'react';
import { X, Sparkles, FileText, Search, HelpCircle, BookOpen, Send } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui';

const aiActions = [
  { id: 'summarize', label: '总结长文要点', icon: <FileText className="w-5 h-5" />, description: '快速提炼文章核心观点' },
  { id: 'search', label: '智能语义搜索', icon: <Search className="w-5 h-5" />, description: '理解意图，精准匹配内容' },
  { id: 'answer', label: '回答相关问题', icon: <HelpCircle className="w-5 h-5" />, description: '基于上下文智能解答' },
  { id: 'recommend', label: '推荐学习内容', icon: <BookOpen className="w-5 h-5" />, description: '个性化内容推荐' },
];

export function AIAssistant() {
  const { state, dispatch } = useApp();
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    if (!inputValue.trim()) return;
    dispatch({ type: 'ADD_AI_MESSAGE', payload: { role: 'user', content: inputValue } });
    setInputValue('');

    // Simulate AI response
    setTimeout(() => {
      dispatch({
        type: 'ADD_AI_MESSAGE',
        payload: {
          role: 'assistant',
          content: '好的，我已经理解了你的问题。让我为你搜索相关的内容...',
        },
      });
    }, 1000);
  };

  const handleAction = (actionId: string) => {
    dispatch({ type: 'SET_AI_ACTION', payload: actionId as any });
    dispatch({
      type: 'ADD_AI_MESSAGE',
      payload: {
        role: 'user',
        content: `我想使用"${aiActions.find(a => a.id === actionId)?.label}"功能`,
      },
    });
    setTimeout(() => {
      dispatch({
        type: 'ADD_AI_MESSAGE',
        payload: {
          role: 'assistant',
          content: '好的，请告诉我你想总结的文章链接或者具体内容，我会在几秒钟内为你提炼出核心要点。',
        },
      });
    }, 1000);
  };

  if (!state.aiAssistant.isOpen) {
    return (
      <button
        onClick={() => dispatch({ type: 'TOGGLE_AI_ASSISTANT' })}
        className="fixed bottom-20 lg:bottom-24 right-4 lg:right-6 w-14 h-14 bg-gradient-to-br from-indigo-600 to-cyan-500 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center z-40"
      >
        <Sparkles className="w-6 h-6 text-white" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 lg:bottom-24 right-4 lg:right-6 w-[360px] lg:w-[400px] bg-white rounded-2xl shadow-2xl z-50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-cyan-500 p-4 text-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            <span className="font-semibold">AI 课代表</span>
          </div>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_AI_ASSISTANT' })}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-white/80">小明 · 随时为你服务</p>
      </div>

      {/* Body */}
      <div className="p-4">
        {state.aiAssistant.messages.length === 0 ? (
          <>
            <p className="text-sm text-slate-600 mb-4">👋 你好！我是AI课代表，可以帮你：</p>
            <div className="grid grid-cols-2 gap-3">
              {aiActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleAction(action.id)}
                  className="flex flex-col items-start p-3 bg-slate-50 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-colors text-left"
                >
                  <div className="mb-2">{action.icon}</div>
                  <div className="font-medium text-sm">{action.label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{action.description}</div>
                </button>
              ))}
            </div>
            <div className="mt-4 p-3 bg-gradient-to-r from-indigo-50 to-cyan-50 rounded-xl">
              <p className="text-xs text-slate-600">
                💡 <strong>提示：</strong>在阅读长文章时，点击"总结长文要点"可快速获取摘要
              </p>
            </div>
          </>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {state.aiAssistant.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="输入你的问题..."
            className="flex-1 px-4 py-2 bg-slate-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Button size="sm" onClick={handleSend} disabled={!inputValue.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
