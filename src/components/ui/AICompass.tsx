import React, { useState, useEffect } from 'react';
import { Compass, ChevronRight, Settings, Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Card, Button } from '@/components/ui';

// 问卷题目类型
interface CompassQuestion {
  id: string;
  question: string;
  options: { text: string; score: number }[];
}

// 根据分数获取等级
export const getLevel = (score: number) => {
  if (score >= 18) return { name: 'AI 先锋', emoji: '🚀', color: 'emerald', desc: '你是社区的 AI 先行者！' };
  if (score >= 14) return { name: 'AI 探索者', emoji: '🔭', color: 'blue', desc: '你正在 AI 道路上不断前行！' };
  if (score >= 10) return { name: 'AI 初学者', emoji: '🌱', color: 'amber', desc: '你有很大的成长空间！' };
  return { name: 'AI 新人', emoji: '💫', color: 'purple', desc: '欢迎加入 AI 之旅！' };
};

// 默认问卷题目
const DEFAULT_QUESTIONS: CompassQuestion[] = [
  {
    id: 'q1',
    question: '你目前在工作中使用 AI 的频率是？',
    options: [
      { text: '几乎每天都在用', score: 4 },
      { text: '经常使用', score: 3 },
      { text: '偶尔使用', score: 2 },
      { text: '很少或没用过', score: 1 },
    ],
  },
  {
    id: 'q2',
    question: '你主要用 AI 做什么？',
    options: [
      { text: '代码开发与调试', score: 4 },
      { text: '文档撰写与总结', score: 3 },
      { text: '信息检索与研究', score: 3 },
      { text: '创意灵感与头脑风暴', score: 2 },
      { text: '还没想好怎么用', score: 1 },
    ],
  },
  {
    id: 'q3',
    question: '你对当前 AI 工具的体验满意吗？',
    options: [
      { text: '非常满意，效率提升明显', score: 4 },
      { text: '还不错，能解决一些问题', score: 3 },
      { text: '一般，经常达不到预期', score: 2 },
      { text: '不满意，不知道怎么用好', score: 1 },
    ],
  },
  {
    id: 'q4',
    question: '你愿意在社区分享 AI 使用经验吗？',
    options: [
      { text: '非常愿意，我有很多心得', score: 4 },
      { text: '愿意，但需要一些时间整理', score: 3 },
      { text: '看情况，有特别案例会分享', score: 2 },
      { text: '不太愿意，我还在学习阶段', score: 1 },
    ],
  },
  {
    id: 'q5',
    question: '你最希望从社区获得什么？',
    options: [
      { text: '实用的 AI 工具和技巧', score: 4 },
      { text: '行业最新资讯和趋势', score: 3 },
      { text: '同行交流和答疑解惑', score: 3 },
      { text: '项目案例和灵感启发', score: 2 },
    ],
  },
];

// 导出问卷题目获取函数
export const getCompassQuestions = (): CompassQuestion[] => {
  const saved = localStorage.getItem('aiCompassQuestions');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return DEFAULT_QUESTIONS;
    }
  }
  return DEFAULT_QUESTIONS;
};

// 导出检查完成状态的函数
export const isCompassCompleted = (): boolean => {
  return !!localStorage.getItem('aiCompassCompleted');
};

// AICompassWidget - 只显示卡片，不包含模态框
export function AICompassWidget({ onOpen }: { onOpen: () => void }) {
  const { state } = useApp();
  const [hasCompleted, setHasCompleted] = useState(false);
  const [levelInfo, setLevelInfo] = useState(getLevel(0));

  useEffect(() => {
    const completed = localStorage.getItem('aiCompassCompleted');
    setHasCompleted(!!completed);

    // 计算当前等级
    const savedScore = localStorage.getItem('aiCompassScore');
    if (savedScore) {
      setLevelInfo(getLevel(parseInt(savedScore, 10)));
    }
  }, []);

  return (
    <Card
      hover
      className="cursor-pointer group relative overflow-hidden"
      onClick={onOpen}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-xl flex items-center justify-center text-white shrink-0">
          <Compass className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900">AI Compass</h3>
            {!hasCompleted && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">新</span>
            )}
          </div>
          <p className="text-sm text-slate-500 truncate">
            {hasCompleted
              ? `你是${levelInfo.name} · 点击查看或重新测试`
              : '5道题测出你的AI段位，领取专属成长建议'}
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
      </div>
    </Card>
  );
}

// AICompassModal - 独立的模态框组件，可以在 App 层级渲染
export function AICompassModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { state, dispatch } = useApp();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResult, setShowResult] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [isAdminEditing, setIsAdminEditing] = useState(false);
  const [editingQuestions, setEditingQuestions] = useState<CompassQuestion[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<CompassQuestion | null>(null);

  const isAdmin = (state.user as any).isAdmin;
  const questions = getCompassQuestions();

  useEffect(() => {
    if (isOpen) {
      const completed = localStorage.getItem('aiCompassCompleted');
      setHasCompleted(!!completed);
      // 如果已完成的，再次打开时显示结果
      if (completed) {
        setShowResult(true);
      }
    } else {
      // 关闭时重置状态
      setCurrentStep(0);
      setAnswers({});
      setShowResult(false);
      setShowAdmin(false);
      setIsAdminEditing(false);
      setEditingQuestions([]);
      setEditingQuestion(null);
    }
  }, [isOpen]);

  const totalScore = Object.values(answers).reduce((sum, score) => sum + score, 0);
  const level = getLevel(totalScore);
  const maxScore = questions.length * 4;
  const progress = (totalScore / maxScore) * 100;

  const handleAnswer = (questionId: string, score: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: score }));
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    setShowResult(true);
    localStorage.setItem('aiCompassCompleted', 'true');
    localStorage.setItem('aiCompassScore', totalScore.toString());
    setHasCompleted(true);
  };

  const handleReset = () => {
    setAnswers({});
    setCurrentStep(0);
    setShowResult(false);
    localStorage.removeItem('aiCompassCompleted');
    localStorage.removeItem('aiCompassScore');
    setHasCompleted(false);
  };

  // 管理员功能
  const handleSaveQuestions = () => {
    localStorage.setItem('aiCompassQuestions', JSON.stringify(editingQuestions));
    setIsAdminEditing(false);
    setEditingQuestions([]);
    alert('问卷配置已保存！');
  };

  const handleAddQuestion = () => {
    const newQuestion: CompassQuestion = {
      id: `q_${Date.now()}`,
      question: '',
      options: [
        { text: '', score: 4 },
        { text: '', score: 2 },
      ],
    };
    setEditingQuestion(newQuestion);
  };

  const handleEditQuestion = (q: CompassQuestion) => {
    setEditingQuestion({ ...q, options: [...q.options] });
  };

  const handleDeleteQuestion = (id: string) => {
    if (confirm('确定要删除这道问题吗？')) {
      setEditingQuestions(editingQuestions.filter(q => q.id !== id));
    }
  };

  const handleSaveQuestion = () => {
    if (!editingQuestion) return;
    if (!editingQuestion.question.trim()) {
      alert('请输入问题内容');
      return;
    }
    // 过滤掉空选项
    const validOptions = editingQuestion.options.filter(opt => opt.text.trim());
    if (validOptions.length < 2) {
      alert('至少需要2个选项');
      return;
    }
    const questionToSave = { ...editingQuestion, options: validOptions };
    const existingIndex = editingQuestions.findIndex(q => q.id === editingQuestion.id);
    if (existingIndex >= 0) {
      const updated = [...editingQuestions];
      updated[existingIndex] = questionToSave;
      setEditingQuestions(updated);
    } else {
      setEditingQuestions([...editingQuestions, questionToSave]);
    }
    setEditingQuestion(null);
  };

  const handleAddOption = () => {
    if (!editingQuestion) return;
    const newScore = Math.max(1, editingQuestion.options.length > 0
      ? Math.min(...editingQuestion.options.map(o => o.score)) - 1
      : 4);
    setEditingQuestion({
      ...editingQuestion,
      options: [...editingQuestion.options, { text: '', score: newScore }],
    });
  };

  const handleRemoveOption = (index: number) => {
    if (!editingQuestion) return;
    if (editingQuestion.options.length <= 2) {
      alert('至少需要2个选项');
      return;
    }
    const newOptions = editingQuestion.options.filter((_, i) => i !== index);
    setEditingQuestion({ ...editingQuestion, options: newOptions });
  };

  const handleOpenAdmin = () => {
    setEditingQuestions([...questions]);
    setShowAdmin(true);
    setIsAdminEditing(true);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-indigo-600 to-cyan-600 p-6 text-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">AI Compass</h2>
                <p className="text-white/70 text-sm">
                  {showAdmin ? '问题维护' : '探索你的 AI 成长之路'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && !showAdmin && (
                <button
                  onClick={handleOpenAdmin}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title="维护问题"
                >
                  <Settings className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <span className="text-xl">&times;</span>
              </button>
            </div>
          </div>
          {/* Progress Bar */}
          {!showResult && !showAdmin && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-white/70 mb-2">
                <span>问题 {currentStep + 1} / {questions.length}</span>
                <span>已完成 {Math.round(((currentStep + (answers[questions[currentStep]?.id] ? 1 : 0)) / questions.length) * 100)}%</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + (answers[questions[currentStep]?.id] ? 1 : 0)) / questions.length) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {showAdmin ? (
            isAdminEditing ? (
              <div className="space-y-4">
                {editingQuestion ? (
                  <div className="space-y-4 bg-slate-50 rounded-xl p-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">问题内容</label>
                      <textarea
                        value={editingQuestion.question}
                        onChange={(e) => setEditingQuestion({ ...editingQuestion, question: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        rows={2}
                        placeholder="输入问题内容..."
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-slate-700">选项</label>
                        <button
                          onClick={handleAddOption}
                          className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700"
                        >
                          <Plus className="w-3 h-3" />
                          添加选项
                        </button>
                      </div>
                      {editingQuestion.options.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={opt.text}
                            onChange={(e) => {
                              const newOptions = [...editingQuestion.options];
                              newOptions[idx] = { ...opt, text: e.target.value };
                              setEditingQuestion({ ...editingQuestion, options: newOptions });
                            }}
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            placeholder={`选项 ${idx + 1}`}
                          />
                          <input
                            type="number"
                            value={opt.score}
                            onChange={(e) => {
                              const newOptions = [...editingQuestion.options];
                              newOptions[idx] = { ...opt, score: parseInt(e.target.value) || 0 };
                              setEditingQuestion({ ...editingQuestion, options: newOptions });
                            }}
                            className="w-16 px-2 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-center"
                            min="1"
                            max="10"
                          />
                          <span className="text-xs text-slate-500">分</span>
                          {editingQuestion.options.length > 2 && (
                            <button
                              onClick={() => handleRemoveOption(idx)}
                              className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                              title="删除此选项"
                            >
                              <X className="w-4 h-4 text-red-500" />
                            </button>
                          )}
                        </div>
                      ))}
                      <p className="text-xs text-slate-400">提示：分数越高表示该选项越积极/正面</p>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <Button onClick={handleSaveQuestion} className="flex-1">
                        <Save className="w-4 h-4" />
                        保存
                      </Button>
                      <Button variant="secondary" onClick={() => setEditingQuestion(null)}>
                        取消
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-900">问卷题目管理</h3>
                      <span className="text-sm text-slate-500">{editingQuestions.length} 道问题</span>
                    </div>
                    <div className="space-y-3">
                      {editingQuestions.map((q, idx) => (
                        <div key={q.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                          <div className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-medium shrink-0">
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 line-clamp-2">{q.question || '(未设置问题)'}</p>
                            <p className="text-xs text-slate-500 mt-1">{q.options.length} 个选项</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => handleEditQuestion(q)} className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors">
                              <Edit2 className="w-4 h-4 text-slate-500" />
                            </button>
                            <button onClick={() => handleDeleteQuestion(q.id)} className="p-1.5 hover:bg-red-100 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
                      <Button onClick={handleAddQuestion} variant="secondary" className="flex-1">
                        <Plus className="w-4 h-4" />
                        添加问题
                      </Button>
                      <Button onClick={handleSaveQuestions} className="flex-1">
                        <Save className="w-4 h-4" />
                        保存全部
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">当前问卷预览</h3>
                  <Button variant="secondary" size="sm" onClick={() => setIsAdminEditing(true)}>
                    <Edit2 className="w-4 h-4" />
                    编辑
                  </Button>
                </div>
                <div className="space-y-3">
                  {questions.map((q, idx) => (
                    <div key={q.id} className="p-3 bg-slate-50 rounded-xl">
                      <p className="font-medium text-slate-900 text-sm">{idx + 1}. {q.question}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          ) : !showResult ? (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {questions[currentStep].question}
                </h3>
              </div>
              <div className="space-y-3">
                {questions[currentStep].options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(questions[currentStep].id, option.score)}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      answers[questions[currentStep].id] === option.score
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        answers[questions[currentStep].id] === option.score
                          ? 'border-indigo-500 bg-indigo-500'
                          : 'border-slate-300'
                      }`}>
                        {answers[questions[currentStep].id] === option.score && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                      <span className="font-medium">{option.text}</span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between pt-4">
                <Button variant="ghost" onClick={handlePrev} disabled={currentStep === 0}>
                  上一步
                </Button>
                {currentStep < questions.length - 1 ? (
                  <Button onClick={handleNext} disabled={!answers[questions[currentStep].id]}>
                    下一题
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={Object.keys(answers).length < questions.length}>
                    查看结果
                  </Button>
                )}
              </div>
              <p className="text-center text-xs text-slate-400">
                完全匿名 · 仅用于个性化推荐
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br ${
                  level.color === 'emerald' ? 'from-emerald-400 to-emerald-600' :
                  level.color === 'blue' ? 'from-blue-400 to-blue-600' :
                  level.color === 'amber' ? 'from-amber-400 to-amber-600' :
                  'from-purple-400 to-purple-600'
                } text-white text-3xl mb-4`}>
                  {level.emoji}
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">{level.name}</h3>
                <p className="text-slate-500 mb-4">{level.desc}</p>
                <div className="max-w-xs mx-auto">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-slate-500">AI 段位</span>
                    <span className="font-semibold text-slate-900">{totalScore} / {maxScore}</span>
                  </div>
                  <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        level.color === 'emerald' ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' :
                        level.color === 'blue' ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                        level.color === 'amber' ? 'bg-gradient-to-r from-amber-400 to-amber-600' :
                        'bg-gradient-to-r from-purple-400 to-purple-600'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-4">
                <Button variant="secondary" className="flex-1" onClick={handleReset}>
                  <span className="transform rotate-180">↻</span>
                  重新测试
                </Button>
                <Button className="flex-1" onClick={onClose}>
                  完成 ✓
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
