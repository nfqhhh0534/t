import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Plus, Menu, Settings, Sparkles, Flame, User, X, MessageCircle, ThumbsUp, Award, Gift, Eye, Check, Trash2, LogOut } from 'lucide-react';
import { Avatar, Button, Input } from '@/components/ui';
import { useApp } from '@/context/AppContext';
import { NavSection } from '@/types';

const navItems: { id: NavSection; label: string }[] = [
  { id: 'home', label: '首页' },
  { id: 'ask', label: '所有人问所有人' },
  { id: 'aihub', label: 'AI Hub' },
  { id: 'insights', label: '见闻洞察' },
  { id: 'market', label: '极客百宝箱' },
];

// 通知图标映射
const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'answer_received':
      return <MessageCircle className="w-4 h-4 text-blue-500" />;
    case 'answer_accepted':
      return <Check className="w-4 h-4 text-emerald-500" />;
    case 'like_received':
      return <ThumbsUp className="w-4 h-4 text-red-500" />;
    case 'badge_earned':
      return <Award className="w-4 h-4 text-amber-500" />;
    case 'points_earned':
      return <Gift className="w-4 h-4 text-purple-500" />;
    case 'insight_picked':
      return <Eye className="w-4 h-4 text-indigo-500" />;
    case 'system':
    default:
      return <Bell className="w-4 h-4 text-slate-500" />;
  }
};

// 格式化时间
const formatTime = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return new Date(date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
};

export function Header() {
  const { state, dispatch, unreadCount } = useApp();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editName, setEditName] = useState(state.user.name);
  const [editDepartment, setEditDepartment] = useState(state.user.department);
  const [editTitle, setEditTitle] = useState(state.user.title);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭通知下拉
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaveProfile = () => {
    dispatch({
      type: 'UPDATE_USER_PROFILE',
      payload: {
        name: editName.trim() || state.user.name,
        department: editDepartment.trim() || state.user.department,
        title: editTitle.trim() || state.user.title,
      }
    });
    setShowProfileModal(false);
    alert('个人信息已更新！');
  };

  // 登出功能
  const handleLogout = () => {
    // 清除所有登录相关的 localStorage
    localStorage.removeItem('demo_mode');
    localStorage.removeItem('wecom_logged_in');
    localStorage.removeItem('userProfile');

    // 重置用户状态为访客
    dispatch({
      type: 'UPDATE_USER_PROFILE',
      payload: {
        id: 'guest',
        name: '访客',
        department: '',
        title: '',
        energy: 0,
        badges: [],
        level: 'newstar' as const,
      }
    });

    // 跳转到登录页
    dispatch({ type: 'SET_SECTION', payload: 'login' });
    setShowProfileModal(false);
  };

  const handleMarkAllRead = () => {
    dispatch({ type: 'MARK_ALL_NOTIFICATIONS_READ' });
  };

  const handleMarkRead = (id: string) => {
    dispatch({ type: 'MARK_NOTIFICATION_READ', payload: id });
  };

  const handleDeleteNotification = (id: string) => {
    dispatch({ type: 'DELETE_NOTIFICATION', payload: id });
  };

  const handleNotificationClick = (notification: typeof state.notifications[0]) => {
    // 标记为已读
    if (!notification.isRead) {
      handleMarkRead(notification.id);
    }
    // 根据通知类型跳转到相应页面
    if (notification.sourceType === 'question' && notification.sourceId) {
      dispatch({ type: 'SET_SECTION', payload: 'ask' });
    }
    setShowNotifications(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200 z-50">
      <div className="h-full max-w-[1600px] mx-auto px-4 lg:px-6 flex items-center justify-between">
        {/* Logo & Mobile Menu */}
        <div className="flex items-center gap-3">
          <button className="lg:hidden p-2 hover:bg-slate-100 rounded-lg">
            <Menu className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => dispatch({ type: 'SET_SECTION', payload: 'home' })}>
            <img src="/spark-hub-logo-small.png" alt="Spark Hub" className="w-9 h-9 rounded-lg object-cover" />
            <span className="hidden sm:block font-bold text-lg text-indigo-600">Spark Hub</span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => dispatch({ type: 'SET_SECTION', payload: item.id })}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                state.currentSection === item.id
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Search */}
          <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg text-slate-500 hover:bg-slate-200 transition-colors">
            <Search className="w-4 h-4" />
            <span className="text-sm">搜索内容...</span>
          </button>

          {/* Mobile Search */}
          <button className="sm:hidden p-2 hover:bg-slate-100 rounded-lg">
            <Search className="w-5 h-5 text-slate-600" />
          </button>

          {/* Publish Button */}
          <Button size="sm" className="hidden sm:flex" onClick={() => {
            dispatch({ type: 'SET_SECTION', payload: 'ask' });
            dispatch({ type: 'SET_OPEN_ASK_MODAL', payload: true });
          }}>
            <Plus className="w-4 h-4" />
            发布
          </Button>

          {/* Mobile Publish */}
          <Button size="sm" className="sm:hidden p-2" onClick={() => {
            dispatch({ type: 'SET_SECTION', payload: 'ask' });
            dispatch({ type: 'SET_OPEN_ASK_MODAL', payload: true });
          }}>
            <Plus className="w-4 h-4" />
          </Button>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notificationRef}>
            <button
              className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="w-5 h-5 text-slate-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-indigo-50">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-indigo-600" />
                    <span className="font-semibold text-slate-800">消息通知</span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">
                        {unreadCount} 未读
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                        title="全部标为已读"
                      >
                        <Check className="w-4 h-4 text-emerald-500" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Notification List */}
                <div className="max-h-[400px] overflow-y-auto">
                  {state.notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                      <Bell className="w-12 h-12 text-slate-200 mb-3" />
                      <p className="text-slate-500 text-sm">暂无通知</p>
                      <p className="text-slate-400 text-xs mt-1">收到回答、被采纳时会收到通知</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {state.notifications.slice(0, 20).map((notification) => (
                        <div
                          key={notification.id}
                          className={`relative px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer ${
                            !notification.isRead ? 'bg-indigo-50/50' : ''
                          }`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start gap-3">
                            {/* Icon */}
                            <div className={`mt-0.5 p-2 rounded-full ${
                              !notification.isRead ? 'bg-indigo-100' : 'bg-slate-100'
                            }`}>
                              {getNotificationIcon(notification.type)}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className={`text-sm font-medium truncate ${
                                  !notification.isRead ? 'text-slate-900' : 'text-slate-600'
                                }`}>
                                  {notification.title}
                                </p>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center justify-between mt-1.5">
                                <span className="text-xs text-slate-400">
                                  {formatTime(notification.createdAt)}
                                </span>
                                {!notification.isRead && (
                                  <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                              {!notification.isRead && (
                                <button
                                  onClick={() => handleMarkRead(notification.id)}
                                  className="p-1 hover:bg-slate-200 rounded transition-colors"
                                  title="标为已读"
                                >
                                  <Check className="w-3.5 h-3.5 text-slate-400" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteNotification(notification.id)}
                                className="p-1 hover:bg-red-100 rounded transition-colors"
                                title="删除"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                {state.notifications.length > 0 && state.notifications.length >= 20 && (
                  <div className="px-4 py-2 border-t border-slate-100 bg-slate-50">
                    <p className="text-center text-xs text-slate-400">
                      已显示最近 20 条通知
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Admin Settings (only show for admin users) */}
          {(state.user as any).isAdmin && (
            <button
              onClick={() => dispatch({ type: 'SET_SECTION', payload: 'admin' })}
              className={`p-2 rounded-lg transition-colors ${
                state.currentSection === 'admin'
                  ? 'bg-indigo-100 text-indigo-600'
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
              title="管理员后台"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}

          {/* Energy Display */}
          <button
            onClick={() => dispatch({ type: 'SET_SECTION', payload: 'points' })}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 rounded-full transition-colors"
          >
            <Flame className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-600">{state.user.energy.toLocaleString()}</span>
          </button>

          {/* User Avatar */}
          <button
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-2 p-1 hover:bg-slate-100 rounded-lg"
            title="编辑个人信息"
          >
            <Avatar name={state.user.name} size="sm" />
          </button>
        </div>
      </div>

      {/* Profile Edit Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={(e) => e.target === e.currentTarget && setShowProfileModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-cyan-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">编辑个人信息</h2>
                  <p className="text-xs text-slate-500">设置你在社区显示的身份</p>
                </div>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Profile Form */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  姓名/昵称 <span className="text-red-500">*</span>
                </label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="请输入你的姓名或昵称"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  部门 <span className="text-red-500">*</span>
                </label>
                <Input
                  value={editDepartment}
                  onChange={(e) => setEditDepartment(e.target.value)}
                  placeholder="例如：技术部、产品部、设计部"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  职位/岗位 <span className="text-red-500">*</span>
                </label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="例如：前端工程师、产品经理"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200 bg-slate-50">
              {/* 登出按钮 */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors mr-auto"
              >
                <LogOut className="w-4 h-4" />
                <span>退出登录</span>
              </button>
              <div className="flex items-center gap-3">
                <Button variant="secondary" onClick={() => setShowProfileModal(false)}>
                  取消
                </Button>
                <Button onClick={handleSaveProfile}>
                  保存修改
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
