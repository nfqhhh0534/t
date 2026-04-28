import React, { useState, useEffect } from 'react';
import { Shield, Users, Settings, AlertTriangle, CheckCircle, XCircle, Search, Plus, X, Bot, Check, XCircleIcon, Clock } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Card, CardHeader, CardTitle, Avatar, Tag, Button, Input, StatusBadge } from '@/components/ui';
import { profilesApi, insightsApi } from '@/services/supabase';
import { getProjectStatusInfo, formatTimeAgo } from '@/utils';
import { ProjectStatus } from '@/types';

// 预设部门选项
export const DEPARTMENTS = [
  'Service',
  'Technology',
  'Product',
  'Design',
  'Data',
  'Operation',
  'Marketing',
  'HR',
  'Finance',
  'AI研究院',
  'AI平台部',
  '智能应用部',
  '数据产品部',
] as const;

interface Profile {
  id: string;
  name: string;
  department: string;
  position: string;
  energy: number;
  level: string;
  is_admin?: boolean;
  created_at: string;
}

interface Insight {
  id: string;
  title: string;
  category: string;
  author_id: string;
  editor_pick: boolean;
  is_featured: boolean;
  created_at: string;
}

export function AdminPage() {
  const { state, dispatch } = useApp();
  const [users, setUsers] = useState<Profile[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'insights' | 'projects'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // User creation form state
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserDepartment, setNewUserDepartment] = useState<string>(DEPARTMENTS[0]);
  const [isCreating, setIsCreating] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load users
      const usersData = await profilesApi.getAll();
      setUsers(usersData || []);

      // Load insights
      const insightsData = await insightsApi.getAll();
      setInsights(insightsData || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      showMessage('error', '加载数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  // Toggle admin status
  const toggleAdmin = async (userId: string, currentStatus: boolean) => {
    try {
      await profilesApi.update(userId, { is_admin: !currentStatus });
      setUsers(users.map(u =>
        u.id === userId ? { ...u, is_admin: !currentStatus } : u
      ));
      showMessage('success', `已${!currentStatus ? '添加' : '移除'}管理员权限`);
    } catch (error) {
      console.error('Failed to update admin status:', error);
      showMessage('error', '更新失败');
    }
  };

  // Toggle editor pick
  const toggleEditorPick = async (insightId: string, currentStatus: boolean) => {
    try {
      await insightsApi.update(insightId, { editor_pick: !currentStatus });
      setInsights(insights.map(i =>
        i.id === insightId ? { ...i, editor_pick: !currentStatus } : i
      ));
      showMessage('success', `已${!currentStatus ? '标记为' : '取消'}编辑精选`);
    } catch (error) {
      console.error('Failed to update editor pick:', error);
      showMessage('error', '更新失败');
    }
  };

  // Delete insight
  const deleteInsight = async (insightId: string) => {
    if (!confirm('确定要删除这条见解吗？')) return;

    try {
      await insightsApi.delete(insightId);
      setInsights(insights.filter(i => i.id !== insightId));
      showMessage('success', '见解已删除');
    } catch (error) {
      console.error('Failed to delete insight:', error);
      showMessage('error', '删除失败');
    }
  };

  // Approve project
  const approveProject = (projectId: string, newStatus: ProjectStatus) => {
    dispatch({ type: 'APPROVE_PROJECT', payload: { id: projectId, status: newStatus } });
    showMessage('success', `项目已${newStatus === 'archived' ? '拒绝' : '审核通过'}`);
  };

  // Get pending projects count
  const pendingProjectsCount = state.projects.filter(p => p.status === 'pending').length;

  // Create new user
  const handleCreateUser = async () => {
    if (!newUserName.trim()) {
      showMessage('error', '请输入用户姓名');
      return;
    }

    setIsCreating(true);
    try {
      const newUser = await profilesApi.create({
        name: newUserName.trim(),
        department: newUserDepartment,
        position: '',
      });

      // Reload users list
      const usersData = await profilesApi.getAll();
      setUsers(usersData || []);

      // Reset form
      setNewUserName('');
      setNewUserDepartment(DEPARTMENTS[0]);
      setShowCreateUserModal(false);

      showMessage('success', `用户 "${newUser.name}" 创建成功！初始能量值: 100`);
    } catch (error) {
      console.error('Failed to create user:', error);
      showMessage('error', '创建用户失败');
    } finally {
      setIsCreating(false);
    }
  };

  // Reset create user form
  const resetCreateForm = () => {
    setNewUserName('');
    setNewUserDepartment(DEPARTMENTS[0]);
    setShowCreateUserModal(false);
  };

  // Filter users
  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter insights
  const filteredInsights = insights.filter(i =>
    i.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get projects from state
  const pendingProjects = state.projects.filter(p => p.status === 'pending');
  const filteredProjects = pendingProjects.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">管理员后台</h1>
            <p className="text-slate-500">管理用户权限和内容审核</p>
          </div>
        </div>

        {/* Add User Button */}
        {activeTab === 'users' && (
          <Button onClick={() => setShowCreateUserModal(true)}>
            <Plus className="w-4 h-4" />
            新增用户
          </Button>
        )}
      </div>

      {/* Message */}
      {message && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl ${
          message.type === 'success'
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-red-100 text-red-700'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'users'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="w-5 h-5" />
          用户管理
          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">
            {users.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('insights')}
          className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'insights'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Settings className="w-5 h-5" />
          内容管理
          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">
            {insights.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'projects'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Bot className="w-5 h-5" />
          项目审核
          {pendingProjectsCount > 0 && (
            <span className="px-2 py-0.5 bg-amber-100 text-amber-600 rounded-full text-xs font-medium">
              {pendingProjectsCount}
            </span>
          )}
        </button>
      </div>

      {/* Search */}
      <div className="w-full lg:w-80">
        <Input
          placeholder={activeTab === 'users' ? '搜索用户...' : '搜索见解...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-12 text-slate-500">
          加载中...
        </div>
      )}

      {/* Users Tab */}
      {!isLoading && activeTab === 'users' && (
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar name={user.name} size="lg" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{user.name}</h3>
                      {user.is_admin && (
                        <Tag color="indigo" size="sm">管理员</Tag>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">
                      {user.department} · {user.position}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      能量值: {user.energy} · 等级: {user.level}
                    </p>
                  </div>
                </div>
                <Button
                  variant={user.is_admin ? 'secondary' : 'primary'}
                  size="sm"
                  onClick={() => toggleAdmin(user.id, user.is_admin || false)}
                >
                  {user.is_admin ? '撤销管理员' : '设为管理员'}
                </Button>
              </div>
            </Card>
          ))}

          {filteredUsers.length === 0 && (
            <Card className="text-center py-12">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600">暂无用户</h3>
            </Card>
          )}
        </div>
      )}

      {/* Insights Tab */}
      {!isLoading && activeTab === 'insights' && (
        <div className="space-y-4">
          {filteredInsights.map((insight) => (
            <Card key={insight.id} className="hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag color="blue" size="sm">{insight.category}</Tag>
                    {insight.editor_pick && (
                      <Tag color="amber" size="sm">编辑精选</Tag>
                    )}
                    {insight.is_featured && (
                      <Tag color="green" size="sm">置顶</Tag>
                    )}
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1">{insight.title}</h3>
                  <p className="text-sm text-slate-500">
                    作者ID: {insight.author_id}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    创建时间: {new Date(insight.created_at).toLocaleString('zh-CN')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={insight.editor_pick ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={() => toggleEditorPick(insight.id, insight.editor_pick)}
                  >
                    {insight.editor_pick ? '取消精选' : '设为精选'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:bg-red-50"
                    onClick={() => deleteInsight(insight.id)}
                  >
                    删除
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {filteredInsights.length === 0 && (
            <Card className="text-center py-12">
              <Settings className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600">暂无见解</h3>
            </Card>
          )}
        </div>
      )}

      {/* Projects Tab */}
      {!isLoading && activeTab === 'projects' && (
        <div className="space-y-4">
          {filteredProjects.length > 0 ? (
            filteredProjects.map((project) => {
              const statusInfo = getProjectStatusInfo(project.status);
              return (
                <Card key={project.id} className="hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-lg">
                          审核中
                        </span>
                        {project.tags.slice(0, 2).map((tag) => (
                          <Tag key={tag.id} color={tag.color} size="sm">{tag.name}</Tag>
                        ))}
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-1">{project.title}</h3>
                      <p className="text-sm text-slate-500 line-clamp-2 mb-3">
                        {project.content}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <div className="flex items-center gap-2">
                          <Avatar name={project.author.name} size="sm" />
                          <span>{project.author.name}</span>
                          <span className="text-slate-400">·</span>
                          <span>{project.author.department}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatTimeAgo(project.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => approveProject(project.id, 'online')}
                      >
                        <Check className="w-4 h-4" />
                        通过
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => approveProject(project.id, 'archived')}
                      >
                        <XCircleIcon className="w-4 h-4" />
                        拒绝
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })
          ) : (
            <Card className="text-center py-12">
              <Bot className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600">暂无待审核项目</h3>
              <p className="text-sm text-slate-400 mt-1">所有项目都已审核完成</p>
            </Card>
          )}
        </div>
      )}

      {/* Create User Modal */}
      {showCreateUserModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
          onClick={(e) => e.target === e.currentTarget && resetCreateForm()}
        >
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">新增用户</h2>
                  <p className="text-xs text-slate-500">创建新用户账号</p>
                </div>
              </div>
              <button
                onClick={resetCreateForm}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Name Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  用户姓名 <span className="text-red-500">*</span>
                </label>
                <Input
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="请输入用户姓名"
                />
              </div>

              {/* Department Select */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  部门 <span className="text-red-500">*</span>
                </label>
                <select
                  value={newUserDepartment}
                  onChange={(e) => setNewUserDepartment(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Info Note */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-700">
                  <span className="font-medium">提示：</span>
                  新用户将获得初始能量值 100，可用于在社区提问和互动。
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200 bg-slate-50">
              <Button variant="secondary" onClick={resetCreateForm}>
                取消
              </Button>
              <Button onClick={handleCreateUser} disabled={isCreating}>
                {isCreating ? '创建中...' : '创建用户'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
