import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Filter, Plus, MessageCircleQuestion, Eye, Star, Clock, CheckCircle, Award, TrendingUp, X, Database, Mic, MicOff, Loader2, Sparkles, Wand2, AlertCircle, ThumbsUp, Bookmark, BookmarkCheck, UserPlus, UserCheck, Trash2, MessageSquare, ArrowRight, MoreHorizontal } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Card, CardHeader, CardTitle, Avatar, Tag, Button, StatusBadge, Input, TextArea } from '@/components/ui';
import { tags } from '@/data/mockData';
import { formatTimeAgo, formatNumber } from '@/utils';
import { answersApi, questionsApi } from '@/services/supabase';

export function AskPage() {
  const { state, dispatch, createQuestion, createAnswer, fetchAnswersForQuestion, earnPoints } = useApp();
  const [activeTab, setActiveTab] = useState<'all' | 'unresolved' | 'resolved'>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Voice input state - using refs to avoid stale closures
  const [isListeningTitle, setIsListeningTitle] = useState(false);
  const [isListeningContent, setIsListeningContent] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [isWeChat, setIsWeChat] = useState(false);

  // Voice permission modal state
  const [showVoicePermissionModal, setShowVoicePermissionModal] = useState(false);
  const [voicePermissionMessage, setVoicePermissionMessage] = useState('');

  // Use refs to track actual state and avoid closure issues
  const isListeningRef = useRef(false);
  const voiceTargetRef = useRef<'title' | 'content' | null>(null);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef('');
  const formTitleRef = useRef('');
  const formContentRef = useRef('');

  // AI summary state
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Question action state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  // Animation state for like/collect
  const [likeAnimation, setLikeAnimation] = useState<string | null>(null);
  const [collectAnimation, setCollectAnimation] = useState<string | null>(null);

  // When detail modal opens, fetch answers from database
  useEffect(() => {
    if (showDetailModal && selectedQuestionId) {
      // Check if it's a UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isUuid = uuidRegex.test(selectedQuestionId);

      if (isUuid || selectedQuestionId.includes('-')) {
        fetchAnswersForQuestion(selectedQuestionId);
      }
    }
  }, [showDetailModal, selectedQuestionId]);

  // 监听 openAskModal 状态，自动打开模态框
  useEffect(() => {
    if (state.openAskModal) {
      openModal();
      dispatch({ type: 'SET_OPEN_ASK_MODAL', payload: false });
    }
  }, [state.openAskModal]);

  // Detect WeChat browser
  const isWeChatBrowser = useCallback(() => {
    if (typeof window === 'undefined') return false;
    const ua = window.navigator.userAgent.toLowerCase();
    return ua.indexOf('micromessenger') > -1;
  }, []);

  // Detect if we're on iOS (Safari has better voice support)
  const isIOS = useCallback(() => {
    if (typeof window === 'undefined') return false;
    const ua = window.navigator.userAgent;
    return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }, []);

  // Check if speech recognition is supported and setup
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check for basic speech recognition support
    const basicSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

    // WeChat browser detection
    const weChat = isWeChatBrowser();
    const ios = isIOS();

    // WeChat on iOS generally supports speech recognition
    // WeChat on Android may have issues, so we provide a fallback message
    if (weChat && !ios) {
      // WeChat on Android - show info but still try to use it
      console.log('Detected WeChat browser on Android - voice support may be limited');
    }

    setIsWeChat(weChat);
    setVoiceSupported(basicSupported);

    if (!basicSupported) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'zh-CN';

    // Handle recognition results
    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // Update the appropriate field based on current target
      if (voiceTargetRef.current === 'title') {
        const currentText = formTitleRef.current.replace(finalTranscriptRef.current, '');
        const newValue = currentText + finalTranscript + interimTranscript;
        formTitleRef.current = newValue;
        // Trigger React state update
        setFormTitle(newValue);
        finalTranscriptRef.current = finalTranscript;
      } else if (voiceTargetRef.current === 'content') {
        const currentText = formContentRef.current.replace(finalTranscriptRef.current, '');
        const newValue = currentText + finalTranscript + interimTranscript;
        formContentRef.current = newValue;
        // Trigger React state update
        setFormContent(newValue);
        finalTranscriptRef.current = finalTranscript;
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);

      if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        if (isWeChatBrowser()) {
          setVoicePermissionMessage('语音权限被拒绝，请在微信中允许麦克风权限');
          setShowVoicePermissionModal(true);
        } else {
          setVoicePermissionMessage('麦克风权限被拒绝，请点击浏览器地址栏旁边的锁图标，允许麦克风访问');
          setShowVoicePermissionModal(true);
        }
      } else if (event.error === 'no-speech') {
        // Silent error - user just didn't say anything
      } else if (event.error === 'network') {
        if (isWeChatBrowser()) {
          setVoicePermissionMessage('网络错误，请在网络良好的环境下使用语音功能');
          setShowVoicePermissionModal(true);
        }
      }

      // Reset all states
      isListeningRef.current = false;
      voiceTargetRef.current = null;
      setIsListeningTitle(false);
      setIsListeningContent(false);
      setIsProcessing(false);
      finalTranscriptRef.current = '';
    };

    recognition.onend = () => {
      // Only restart if we should still be listening
      if (isListeningRef.current && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          // Recognition already running or failed
          isListeningRef.current = false;
          voiceTargetRef.current = null;
          setIsListeningTitle(false);
          setIsListeningContent(false);
          finalTranscriptRef.current = '';
        }
      } else {
        // Clean up
        voiceTargetRef.current = null;
        setIsListeningTitle(false);
        setIsListeningContent(false);
        finalTranscriptRef.current = '';
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.abort();
      } catch (e) {
        // Ignore
      }
    };
  }, []);

  // Voice input function
  const startVoiceInput = (target: 'title' | 'content') => {
    if (!voiceSupported || !recognitionRef.current) {
      setVoicePermissionMessage('您的浏览器不支持语音输入功能，建议使用Chrome或Safari浏览器');
      setShowVoicePermissionModal(true);
      return;
    }

    // If already listening on the same target, stop
    if (isListeningRef.current && voiceTargetRef.current === target) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
      isListeningRef.current = false;
      voiceTargetRef.current = null;
      finalTranscriptRef.current = '';
      if (target === 'title') {
        setIsListeningTitle(false);
      } else {
        setIsListeningContent(false);
      }
      return;
    }

    // If listening on different target, stop first then switch
    if (isListeningRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
      // Reset previous target state
      if (voiceTargetRef.current === 'title') {
        setIsListeningTitle(false);
      } else if (voiceTargetRef.current === 'content') {
        setIsListeningContent(false);
      }
    }

    // Start listening on new target
    setIsProcessing(true);
    finalTranscriptRef.current = '';
    voiceTargetRef.current = target;
    isListeningRef.current = true;

    if (target === 'title') {
      setIsListeningTitle(true);
      setIsListeningContent(false);
    } else {
      setIsListeningContent(true);
      setIsListeningTitle(false);
    }

    try {
      recognitionRef.current.start();
      setIsProcessing(false);
    } catch (e: any) {
      console.error('Recognition start error:', e);
      setIsProcessing(false);
      isListeningRef.current = false;
      voiceTargetRef.current = null;
      finalTranscriptRef.current = '';

      if (target === 'title') {
        setIsListeningTitle(false);
      } else {
        setIsListeningContent(false);
      }

      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        setVoicePermissionMessage(isWeChatBrowser()
          ? '语音权限被拒绝，请在微信设置中允许麦克风权限后重试'
          : '麦克风权限被拒绝，请点击浏览器地址栏旁边的锁图标，允许麦克风访问');
        setShowVoicePermissionModal(true);
      } else {
        setVoicePermissionMessage('语音识别启动失败，请刷新页面重试');
        setShowVoicePermissionModal(true);
      }
    }
  };

  // Form state - 默认选中第一个标签，悬赏默认为10
  const [formTitle, setFormTitleState] = useState('');
  const [formContent, setFormContentState] = useState('');
  const [formTags, setFormTags] = useState<string[]>(tags.length > 0 ? [tags[0].id] : []);
  const [formBounty, setFormBounty] = useState<number>(10); // 默认悬赏10能量
  const [formAnonymous, setFormAnonymous] = useState(false); // 默认不匿名
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Override setters to sync with refs
  const setFormTitle = (value: string | ((prev: string) => string)) => {
    if (typeof value === 'function') {
      formTitleRef.current = value(formTitleRef.current);
    } else {
      formTitleRef.current = value;
    }
    setFormTitleState(value);
  };

  const setFormContent = (value: string | ((prev: string) => string)) => {
    if (typeof value === 'function') {
      formContentRef.current = value(formContentRef.current);
    } else {
      formContentRef.current = value;
    }
    setFormContentState(value);
  };

  // AI Summary function
  const handleAISummary = async () => {
    if (!formContent.trim()) {
      alert('请先输入问题详情，再使用AI总结');
      return;
    }

    setIsSummarizing(true);

    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate a summary title based on content
    const content = formContent.trim();
    let summaryTitle = '';

    // Simple keyword extraction logic
    if (content.includes('部署') || content.includes('安装')) {
      summaryTitle += '如何部署';
    } else if (content.includes('优化') || content.includes('性能')) {
      summaryTitle += '如何优化';
    } else if (content.includes('报错') || content.includes('错误')) {
      summaryTitle += '遇到报错';
    } else if (content.includes('选择') || content.includes('比较')) {
      summaryTitle += '如何选择';
    }

    // Extract key topic
    const words = ['Python', 'JavaScript', 'React', 'Vue', 'API', '数据库', '模型', 'AI', '大模型', 'Prompt', 'Docker', 'Linux', 'Git'];
    for (const word of words) {
      if (content.includes(word)) {
        summaryTitle += (summaryTitle ? ' - ' : '') + word;
        break;
      }
    }

    if (!summaryTitle) {
      summaryTitle = '关于' + content.substring(0, 20).replace(/[？?。.!！]/g, '') + '...';
    }

    setFormTitle(summaryTitle);
    setIsSummarizing(false);
  };

  // Reset form
  const resetForm = () => {
    setFormTitle('');
    setFormContent('');
    setFormTags(tags.length > 0 ? [tags[0].id] : []); // 重置为默认第一个标签
    setFormBounty(10); // 重置为默认悬赏10能量
    setFormAnonymous(false); // 重置为不匿名
    setSubmitSuccess(false);
    if (isListeningRef.current) {
      try {
        recognitionRef.current?.stop();
      } catch (e) {
        // Ignore
      }
      isListeningRef.current = false;
      voiceTargetRef.current = null;
      setIsListeningTitle(false);
      setIsListeningContent(false);
      finalTranscriptRef.current = '';
    }
  };

  // Handle like button click with animation
  const handleLike = (e: React.MouseEvent, questionId: string) => {
    e.stopPropagation();
    const wasLiked = state.likedItems.has(questionId);
    dispatch({ type: 'TOGGLE_LIKE', payload: questionId });

    // 如果是点赞（之前没有点过），触发动画
    if (!wasLiked) {
      setLikeAnimation(questionId);
      setTimeout(() => setLikeAnimation(null), 600);
    }
  };

  // Handle collect/favorite button click with animation
  const handleCollect = (e: React.MouseEvent, questionId: string) => {
    e.stopPropagation();
    const wasCollected = state.collectedItems.has(questionId);
    dispatch({ type: 'TOGGLE_COLLECT', payload: questionId });

    // 如果是收藏（之前没有收藏过），触发动画
    if (!wasCollected) {
      setCollectAnimation(questionId);
      setTimeout(() => setCollectAnimation(null), 600);
    }
  };

  // Handle follow button click
  const handleFollow = (e: React.MouseEvent, authorId: string) => {
    e.stopPropagation();
    dispatch({ type: 'TOGGLE_FOLLOW', payload: authorId });
    // 如果是关注（之前没有关注过），给予积分
    if (!state.followedUsers.has(authorId)) {
      // earnPoints('receive_follow'); // 取消注释以启用被关注获得积分
    }
  };

  // Handle delete question
  const handleDelete = (e: React.MouseEvent, questionId: string) => {
    e.stopPropagation();
    setActiveMenuId(null);
    if (confirm('确定要删除这个问题吗？')) {
      dispatch({ type: 'SET_QUESTIONS', payload: state.questions.filter(q => q.id !== questionId) });
    }
  };

  // Handle reply - open reply modal
  const handleReply = async (e: React.MouseEvent, questionId: string) => {
    e.stopPropagation();
    setActiveMenuId(null);
    setSelectedQuestionId(questionId);

    // Fetch latest answers before opening reply modal
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUuid = uuidRegex.test(questionId);

    if (isUuid || questionId.includes('-')) {
      try {
        await fetchAnswersForQuestion(questionId);
      } catch (error) {
        console.error('Failed to fetch answers:', error);
      }
    }

    setShowReplyModal(true);
  };

  // Handle view detail - open detail modal
  const handleViewDetail = async (e: React.MouseEvent, questionId: string) => {
    e.stopPropagation();
    setActiveMenuId(null);
    setSelectedQuestionId(questionId);
    setShowDetailModal(true);

    // Fetch answers from database when opening detail modal
    // UUID format: 8-4-4-4-12 hex characters
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUuid = uuidRegex.test(questionId);

    if (isUuid || questionId.includes('-')) {
      // For questions from DB (UUID format), fetch their answers
      try {
        await fetchAnswersForQuestion(questionId);
      } catch (error) {
        console.error('Failed to fetch answers:', error);
      }
    }
    // Local questions (q_timestamp format) don't need fetching - they use local state
  };

  // Handle accept answer - mark answer as accepted and resolve the question
  const handleAcceptAnswer = async (questionId: string, answerId: string) => {
    if (!confirm('确定要采纳这个回答吗？采纳后问题将被标记为已解决。')) {
      return;
    }

    // Find the question and the answer author
    const question = state.questions.find(q => q.id === questionId);
    if (!question) return;
    const acceptedAnswer = question.answers?.find(a => a.id === answerId);

    // Update local state: mark answer as accepted and question as resolved
    dispatch({
      type: 'UPDATE_QUESTION',
      payload: {
        id: questionId,
        updates: {
          status: 'resolved',
          answers: question.answers?.map(a => ({
            ...a,
            isAccepted: a.id === answerId,
          })),
        }
      }
    });

    // Sync to database
    try {
      // Update answer's is_accepted status
      await answersApi.update(answerId, { is_accepted: true });
      // Update question's status to resolved
      await questionsApi.update(questionId, { status: 'resolved' });
      console.log('✅ Answer accepted and question resolved');

      // 给予回答被采纳者积分奖励
      if (acceptedAnswer) {
        earnPoints('answer_accepted', 25, answerId, question.title);
        alert('已采纳回答，问题已标记为已解决！回答者获得 +25 能量奖励');
      } else {
        alert('已采纳回答，问题已标记为已解决！');
      }
    } catch (error) {
      console.error('Failed to accept answer:', error);
      alert('操作失败，请重试');
    }
  };

  // Submit reply
  const handleSubmitReply = async () => {
    if (!replyContent.trim() || !selectedQuestionId) return;

    try {
      // Use createAnswer which will sync to database
      await createAnswer(selectedQuestionId, replyContent.trim());

      setShowReplyModal(false);
      setReplyContent('');
      setSelectedQuestionId(null);
      alert('回复成功！');
    } catch (error) {
      console.error('Failed to submit reply:', error);
      alert('回复提交失败，请重试');
    }
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

  // Toggle tag selection
  const toggleTag = (tagId: string) => {
    setFormTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  // Set bounty
  const selectBounty = (amount: number) => {
    setFormBounty(prev => prev === amount ? 0 : amount);
  };

  // Submit form - now with Supabase integration
  const handleSubmit = async () => {
    // Title is now optional, generate one if empty
    let finalTitle = formTitle.trim();
    if (!finalTitle && formContent.trim()) {
      finalTitle = '关于' + formContent.substring(0, 30).replace(/\n/g, ' ').replace(/[？?。.!！]/g, '') + '...';
    }

    if (!formContent.trim()) {
      alert('请输入问题详情');
      return;
    }
    if (formTags.length === 0) {
      alert('请至少选择一个标签');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get selected tags
      const selectedTags = tags.filter(t => formTags.includes(t.id));

      // Create question using the AppContext method (syncs to Supabase if connected)
      await createQuestion({
        title: finalTitle,
        content: formContent.trim(),
        tags: selectedTags,
        bounty: formBounty > 0 ? formBounty : undefined,
        tagIds: formTags,
        isAnonymous: formAnonymous,
      });

      setIsSubmitting(false);
      setSubmitSuccess(true);

      // Close modal after success feedback
      setTimeout(() => {
        closeModal();
        alert('问题发布成功！');
      }, 1000);
    } catch (error) {
      console.error('Failed to create question:', error);
      setIsSubmitting(false);
      alert('发布失败，请重试');
    }
  };

  const filteredQuestions = state.questions.filter((q) => {
    if (activeTab === 'unresolved') return q.status === 'unresolved';
    if (activeTab === 'resolved') return q.status === 'resolved';
    return true;
  }).filter((q) => {
    if (selectedTag) return q.tags.some((t) => t.id === selectedTag);
    return true;
  }).filter((q) => {
    if (searchQuery) {
      return q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             q.content.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">所有人问所有人</h1>
          <p className="text-slate-500 mt-1">向社区任意专家提问，获得精准解答</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Database connection status */}
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
            发布问题
          </Button>
        </div>
      </div>

      {/* Tabs & Filters */}
      <Card padding="sm">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                activeTab === 'all'
                  ? 'bg-indigo-100 text-indigo-600'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              全部问题
            </button>
            <button
              onClick={() => setActiveTab('unresolved')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                activeTab === 'unresolved'
                  ? 'bg-amber-100 text-amber-600'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              待解决
            </button>
            <button
              onClick={() => setActiveTab('resolved')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                activeTab === 'resolved'
                  ? 'bg-emerald-100 text-emerald-600'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              已解决
            </button>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="flex-1 lg:w-64">
              <Input
                placeholder="搜索问题..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <Button variant="secondary" size="sm">
              <Filter className="w-4 h-4" />
              筛选
            </Button>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedTag === null
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            全部
          </button>
          {tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => setSelectedTag(tag.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedTag === tag.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              style={selectedTag === tag.id ? {} : { backgroundColor: `${tag.color}20`, color: tag.color }}
            >
              {tag.name}
              <span className="ml-1 opacity-60">{tag.count}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Question List */}
      <div className="space-y-4">
        {filteredQuestions.map((question) => (
          <Card key={question.id} hover className="group cursor-pointer" onClick={() => {
            setSelectedQuestionId(question.id);
            setShowDetailModal(true);
          }}>
            <div className="flex items-start gap-4">
              {/* Vote & Answer Stats */}
              <div className="hidden sm:flex flex-col items-center gap-3 pt-1">
                <div className="text-center">
                  <div className={`text-lg font-bold ${question.likes > 20 ? 'text-orange-500' : 'text-slate-700'}`}>
                    {question.likes}
                  </div>
                  <div className="text-xs text-slate-400">赞同</div>
                </div>
                <div className={`text-center px-2 py-1 rounded-lg ${
                  question.status === 'resolved'
                    ? 'bg-emerald-100 text-emerald-600'
                    : question.comments.length > 0
                    ? 'bg-slate-100 text-slate-600'
                    : 'bg-slate-50 text-slate-400'
                }`}>
                  <div className="text-sm font-medium">{question.comments.length || 0}</div>
                  <div className="text-xs">回答</div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {question.tags.map((tag) => (
                    <Tag key={tag.id} color={tag.color} size="sm">{tag.name}</Tag>
                  ))}
                  {question.status === 'resolved' && (
                    <StatusBadge status="resolved" />
                  )}
                  {question.bounty && question.bounty > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-full text-xs font-medium">
                      <Award className="w-3 h-3" />
                      +{question.bounty}能量悬赏
                    </span>
                  )}
                </div>

                <h3 className="font-semibold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                  {question.title}
                </h3>

                <p className="text-sm text-slate-500 line-clamp-2 mb-3">
                  {question.content}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  {/* Author with follow button */}
                  <div className="flex items-center gap-3">
                    <Avatar name={question.author.name} size="sm" />
                    <div className="flex items-center gap-2">
                      <div>
                        <span className="text-sm font-medium text-slate-700">{question.author.name}</span>
                        <span className="text-sm text-slate-400 ml-2">{question.author.department}</span>
                      </div>
                      {question.author.id !== state.user.id && (
                        <button
                          onClick={(e) => handleFollow(e, question.author.id)}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                            state.followedUsers.has(question.author.id)
                              ? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                              : 'bg-slate-100 text-slate-600 hover:bg-indigo-100 hover:text-indigo-600'
                          }`}
                          title={state.followedUsers.has(question.author.id) ? '取消关注' : '关注TA'}
                        >
                          {state.followedUsers.has(question.author.id) ? (
                            <>
                              <UserCheck className="w-3 h-3" />
                              <span>已关注</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-3 h-3" />
                              <span>关注</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Action buttons and stats */}
                  <div className="flex items-center gap-3">
                    {/* Quick Reply button */}
                    <button
                      onClick={(e) => handleReply(e, question.id)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 hover:bg-indigo-100 hover:text-indigo-600 transition-all"
                      title="快速回复"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>回复</span>
                    </button>

                    {/* Like button */}
                    <button
                      onClick={(e) => handleLike(e, question.id)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all relative ${
                        state.likedItems.has(question.id)
                          ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                          : 'bg-slate-100 text-slate-600 hover:bg-orange-100 hover:text-orange-600'
                      } ${likeAnimation === question.id ? 'animate-like-pop' : ''}`}
                      title={state.likedItems.has(question.id) ? '取消点赞' : '点赞'}
                    >
                      {likeAnimation === question.id && (
                        <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-orange-500 font-bold text-xs animate-reputation-float">
                          +2
                        </span>
                      )}
                      <ThumbsUp className={`w-3 h-3 ${state.likedItems.has(question.id) ? 'fill-current' : ''}`} />
                      <span>{question.likes + (state.likedItems.has(question.id) ? 1 : 0)}</span>
                    </button>

                    {/* Collect button */}
                    <button
                      onClick={(e) => handleCollect(e, question.id)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all relative ${
                        state.collectedItems.has(question.id)
                          ? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                          : 'bg-slate-100 text-slate-600 hover:bg-indigo-100 hover:text-indigo-600'
                      } ${collectAnimation === question.id ? 'animate-collect-pop' : ''}`}
                      title={state.collectedItems.has(question.id) ? '取消收藏' : '收藏'}
                    >
                      {collectAnimation === question.id && (
                        <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-indigo-500 font-bold text-xs animate-reputation-float">
                          +1
                        </span>
                      )}
                      {state.collectedItems.has(question.id) ? (
                        <BookmarkCheck className="w-3 h-3 fill-current" />
                      ) : (
                        <Bookmark className="w-3 h-3" />
                      )}
                      <span>{question.收藏 + (state.collectedItems.has(question.id) ? 1 : 0)}</span>
                    </button>

                    {/* More menu */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === question.id ? null : question.id);
                        }}
                        className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
                        title="更多操作"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>

                      {/* Dropdown menu */}
                      {activeMenuId === question.id && (
                        <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10 min-w-32">
                          <button
                            onClick={(e) => handleViewDetail(e, question.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                            <span>进入详情</span>
                          </button>
                          {question.author.id === state.user.id && (
                            <button
                              onClick={(e) => handleDelete(e, question.id)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>删除问题</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(question.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {formatNumber(question.views)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {filteredQuestions.length === 0 && (
          <Card className="text-center py-12">
            <MessageCircleQuestion className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">暂无相关问题</h3>
            <p className="text-sm text-slate-400 mb-4">试试其他标签或搜索关键词</p>
            <Button variant="secondary" onClick={openModal}>
              成为第一个提问者
            </Button>
          </Card>
        )}
      </div>

      {/* Ask Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-cyan-50">
              <h2 className="text-lg font-semibold text-slate-900">发起提问</h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
              {/* WeChat Browser Notice */}
              {isWeChat && (
                <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="text-amber-600 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-800">微信浏览器语音支持说明</p>
                    <p className="text-xs text-amber-600 mt-1">
                      微信内置浏览器部分功能可能受限。如遇语音输入问题，建议：
                      <br/>1. 在微信设置中允许网页使用麦克风
                      <br/>2. 或复制链接到Chrome浏览器中打开
                    </p>
                  </div>
                </div>
              )}

              {/* Title Input - Optional */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700">
                    问题标题 <span className="text-xs text-slate-400">(可选)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAISummary}
                    disabled={isSummarizing || !formContent.trim()}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSummarizing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        AI总结中...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-3.5 h-3.5" />
                        AI生成标题
                      </>
                    )}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="请简要描述你的问题，或使用AI自动生成标题"
                    className="w-full px-4 py-3 pr-12 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-slate-900"
                    maxLength={100}
                  />
                  <button
                    type="button"
                    onClick={() => startVoiceInput('title')}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${
                      isListeningTitle
                        ? 'bg-red-500 text-white animate-pulse'
                        : voiceSupported
                          ? 'bg-slate-100 text-slate-600 hover:bg-indigo-100 hover:text-indigo-600'
                          : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                    }`}
                    title={voiceSupported ? (isWeChat ? '微信语音输入' : '语音输入') : (isWeChat ? '微信浏览器暂不支持语音输入，建议使用Chrome浏览器' : '您的浏览器不支持语音输入')}
                    disabled={!voiceSupported}
                  >
                    {isProcessing && !isListeningContent ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : isListeningTitle ? (
                      <MicOff className="w-5 h-5" />
                    ) : (
                      <Mic className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-slate-400">
                    {formTitle ? '已生成标题，可自行修改' : '标题可由AI根据内容自动生成'}
                  </span>
                  <span className="text-xs text-slate-400">{formTitle.length}/100</span>
                </div>
              </div>

              {/* Content Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  问题详情 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <textarea
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder="详细描述你的问题，包括：&#10;• 背景和场景&#10;• 已尝试的方案&#10;• 遇到的具体问题&#10;• 期望的效果"
                    className="w-full px-4 py-3 pr-12 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none text-slate-900"
                    rows={6}
                    maxLength={2000}
                  />
                  <button
                    type="button"
                    onClick={() => startVoiceInput('content')}
                    className={`absolute right-2 top-3 p-2 rounded-lg transition-all ${
                      isListeningContent
                        ? 'bg-red-500 text-white animate-pulse'
                        : voiceSupported
                          ? 'bg-slate-100 text-slate-600 hover:bg-indigo-100 hover:text-indigo-600'
                          : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                    }`}
                    title={voiceSupported ? (isWeChat ? '微信语音输入' : '语音输入') : (isWeChat ? '微信浏览器暂不支持语音输入，建议使用Chrome浏览器' : '您的浏览器不支持语音输入')}
                    disabled={!voiceSupported}
                  >
                    {isProcessing && !isListeningTitle ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : isListeningContent ? (
                      <MicOff className="w-5 h-5" />
                    ) : (
                      <Mic className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-slate-400">
                    详细的描述有助于快速获得准确回答
                    {isListeningContent && (
                      <span className="ml-2 text-red-500 animate-pulse">● 录音中...</span>
                    )}
                  </span>
                  <span className="text-xs text-slate-400">{formContent.length}/2000</span>
                </div>
              </div>

              {/* Tags Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  选择标签 <span className="text-red-500">*</span>
                  <span className="text-xs text-slate-400 ml-2">(可多选)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        formTags.includes(tag.id)
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                      style={!formTags.includes(tag.id) && tag.color ? { backgroundColor: `${tag.color}20`, color: tag.color } : {}}
                    >
                      {tag.name}
                      {formTags.includes(tag.id) && <span className="ml-1">✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Anonymous Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-700">匿名发布</span>
                    <span className="text-xs text-slate-400">开启后，其他用户将看到"匿名用户"</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormAnonymous(!formAnonymous)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    formAnonymous ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-md ${
                      formAnonymous ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Bounty Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  设置悬赏
                  <span className="text-xs text-slate-400 ml-2">(可选，悬赏能让问题更受关注)</span>
                </label>
                <div className="flex flex-wrap gap-3">
                  {[
                    { amount: 10, label: '+10', desc: '小额悬赏' },
                    { amount: 50, label: '+50', desc: '普通悬赏' },
                    { amount: 100, label: '+100', desc: '高额悬赏' },
                    { amount: 500, label: '+500', desc: '超级悬赏' },
                  ].map((item) => (
                    <button
                      key={item.amount}
                      onClick={() => selectBounty(item.amount)}
                      className={`flex flex-col items-center px-4 py-3 rounded-xl border-2 transition-all ${
                        formBounty === item.amount
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <span className="font-bold text-lg">{item.label}</span>
                      <span className="text-xs opacity-70">{item.desc}</span>
                    </button>
                  ))}
                </div>
                {formBounty > 0 && (
                  <p className="mt-2 text-sm text-indigo-600">
                    💡 已设置 {formBounty} 能量悬赏，问题将被高亮展示
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 border-t border-slate-200 bg-slate-50">
              <div className="text-sm text-slate-500">
                {formTags.length > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="text-indigo-600 font-medium">{formTags.length}</span> 个标签已选择
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={closeModal} disabled={isSubmitting}>
                  取消
                </Button>
                <Button
                  onClick={handleSubmit}
                  isLoading={isSubmitting}
                  disabled={isSubmitting || !formContent.trim() || formTags.length === 0}
                >
                  {isSubmitting ? '发布中...' : submitSuccess ? '发布成功 ✓' : '发布问题'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Voice Permission Modal */}
      {showVoicePermissionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                isWeChat ? 'bg-green-100' : 'bg-amber-100'
              }`}>
                <AlertCircle className={`w-8 h-8 ${isWeChat ? 'text-green-600' : 'text-amber-600'}`} />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">语音权限说明</h3>
              <p className="text-sm text-slate-600 mb-4">{voicePermissionMessage}</p>

              {isWeChat && (
                <div className="text-left bg-slate-50 rounded-lg p-4 mb-4 text-sm text-slate-600">
                  <p className="font-medium text-slate-700 mb-2">如何在微信中开启权限：</p>
                  <ol className="list-decimal list-inside space-y-1.5">
                    <li>点击右上角 <span className="font-medium">"..."</span> 按钮</li>
                    <li>选择 <span className="font-medium">"设置"</span></li>
                    <li>找到 <span className="font-medium">"麦克风"</span> 或 <span className="font-medium">"网页授权"</span></li>
                    <li>允许后刷新页面重试</li>
                  </ol>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowVoicePermissionModal(false)}
                >
                  知道了
                </Button>
                {isWeChat && (
                  <Button
                    className="flex-1"
                    onClick={() => {
                      // Try to request permission again by triggering the microphone button
                      setShowVoicePermissionModal(false);
                    }}
                  >
                    重试
                  </Button>
                )}
              </div>

              {isWeChat && (
                <p className="text-xs text-slate-400 mt-3">
                  或复制链接到Chrome浏览器中打开获得更佳体验
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {showReplyModal && selectedQuestionId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && setShowReplyModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-cyan-50">
              <h2 className="text-lg font-semibold text-slate-900">回复问题</h2>
              <button
                onClick={() => setShowReplyModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Question Preview */}
            {(() => {
              const question = state.questions.find(q => q.id === selectedQuestionId);
              return question ? (
                <div className="p-4 bg-slate-50 border-b border-slate-200">
                  <p className="text-sm text-slate-500 mb-1">回复给：</p>
                  <h3 className="font-medium text-slate-900 line-clamp-2">{question.title}</h3>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-1">{question.content}</p>
                </div>
              ) : null;
            })()}

            {/* Reply Content */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  你的回答 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="请输入你的回答..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none text-slate-900"
                  rows={5}
                  maxLength={2000}
                  autoFocus
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-slate-400">详细的回答更容易被采纳</span>
                  <span className="text-xs text-slate-400">{replyContent.length}/2000</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200 bg-slate-50">
              <Button variant="secondary" onClick={() => setShowReplyModal(false)}>
                取消
              </Button>
              <Button
                onClick={handleSubmitReply}
                disabled={!replyContent.trim()}
              >
                提交回复
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Question Detail Modal */}
      {showDetailModal && selectedQuestionId && (() => {
        const question = state.questions.find(q => q.id === selectedQuestionId);
        if (!question) return null;

        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && setShowDetailModal(false)}>
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-cyan-50 shrink-0">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">问题详情</h2>
                  <p className="text-xs text-slate-500 mt-0.5">查看完整问题和回答</p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Question Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Tags and Status */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {question.tags.map((tag) => (
                    <Tag key={tag.id} color={tag.color} size="sm">{tag.name}</Tag>
                  ))}
                  {question.status === 'resolved' && (
                    <StatusBadge status="resolved" />
                  )}
                  {question.bounty && question.bounty > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-full text-xs font-medium">
                      <Award className="w-3 h-3" />
                      +{question.bounty}能量悬赏
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {question.title}
                </h3>

                {/* Author Info */}
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
                  <Avatar name={question.author.name} size="md" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">{question.author.name}</span>
                      {state.followedUsers.has(question.author.id) && (
                        <span className="text-xs text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">已关注</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">{question.author.department} · {question.author.title}</p>
                  </div>
                  <span className="text-xs text-slate-400 ml-auto">{formatTimeAgo(question.createdAt)}</span>
                </div>

                {/* Question Content */}
                <div className="prose prose-slate max-w-none mb-6">
                  <p className="text-slate-700 whitespace-pre-wrap">{question.content}</p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 text-sm text-slate-500 mb-6 pb-6 border-b border-slate-100">
                  <span className="flex items-center gap-1.5">
                    <ThumbsUp className="w-4 h-4" />
                    {question.likes} 赞同
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4" />
                    {formatNumber(question.views)} 浏览
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4" />
                    {(question.answers?.length || 0) + (question.comments?.length || 0)} 回答
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Bookmark className="w-4 h-4" />
                    {question.收藏} 收藏
                  </span>
                </div>

                {/* Answers Section */}
                <div>
                  <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-indigo-500" />
                    回答 ({(question.answers?.length || 0) + (question.comments?.length || 0)})
                  </h4>

                  {question.answers && question.answers.length > 0 ? (
                    <div className="space-y-4">
                      {question.answers.map((answer) => (
                        <div key={answer.id} className={`rounded-xl p-4 ${answer.isAccepted ? 'bg-emerald-50 border-2 border-emerald-200' : 'bg-slate-50'}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <Avatar name={answer.author.name} size="sm" />
                            <span className="font-medium text-slate-900">{answer.author.name}</span>
                            <span className="text-xs text-slate-400">{answer.author.department}</span>
                            {answer.isAccepted && (
                              <span className="ml-auto text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                已采纳
                              </span>
                            )}
                          </div>
                          <p className="text-slate-700 whitespace-pre-wrap">{answer.content}</p>
                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                            <div className="flex items-center gap-4 text-xs text-slate-400">
                              <span>{formatTimeAgo(answer.createdAt)}</span>
                              <span className="flex items-center gap-1">
                                <ThumbsUp className="w-3 h-3" />
                                {answer.likes}
                              </span>
                            </div>
                            {/* 采纳按钮 - 只有问题作者且问题未解决时显示 */}
                            {question.author.id === state.user.id && question.status !== 'resolved' && !answer.isAccepted && (
                              <button
                                onClick={() => handleAcceptAnswer(question.id, answer.id)}
                                className="flex items-center gap-1 px-3 py-1 text-xs font-medium bg-emerald-100 text-emerald-600 hover:bg-emerald-200 rounded-lg transition-colors"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                采纳此回答
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-slate-50 rounded-xl">
                      <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">暂无回答</p>
                      <p className="text-sm text-slate-400 mt-1">成为第一个回答者吧！</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between p-4 border-t border-slate-200 bg-slate-50 shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleLike(e, question.id)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      state.likedItems.has(question.id)
                        ? 'bg-orange-100 text-orange-600'
                        : 'bg-slate-100 text-slate-600 hover:bg-orange-100 hover:text-orange-600'
                    }`}
                  >
                    <ThumbsUp className={`w-4 h-4 ${state.likedItems.has(question.id) ? 'fill-current' : ''}`} />
                    <span>{question.likes + (state.likedItems.has(question.id) ? 1 : 0)}</span>
                  </button>
                  <button
                    onClick={(e) => handleCollect(e, question.id)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      state.collectedItems.has(question.id)
                        ? 'bg-indigo-100 text-indigo-600'
                        : 'bg-slate-100 text-slate-600 hover:bg-indigo-100 hover:text-indigo-600'
                    }`}
                  >
                    {state.collectedItems.has(question.id) ? (
                      <BookmarkCheck className="w-4 h-4 fill-current" />
                    ) : (
                      <Bookmark className="w-4 h-4" />
                    )}
                    <span>{state.collectedItems.has(question.id) ? '已收藏' : '收藏'}</span>
                  </button>
                </div>
                <Button onClick={() => {
                  setShowDetailModal(false);
                  setShowReplyModal(true);
                }}>
                  <MessageSquare className="w-4 h-4 mr-1" />
                  回复问题
                </Button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
