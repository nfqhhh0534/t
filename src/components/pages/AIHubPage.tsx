import React, { useState, useRef } from 'react';
import { Search, Filter, Plus, Bot, Users, Zap, Clock, Star, Eye, TrendingUp, X, Paperclip, File, Trash2, Download } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Card, CardHeader, CardTitle, Avatar, Tag, Button, Input } from '@/components/ui';
import { tags } from '@/data/mockData';
import { formatTimeAgo, formatNumber, getProjectStatusInfo } from '@/utils';

export function AIHubPage() {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<typeof state.projects[0] | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formTags, setFormTags] = useState<string[]>([]);
  const [formAttachments, setFormAttachments] = useState<{ name: string; size: number; url: string; type: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form
  const resetForm = () => {
    setFormTitle('');
    setFormContent('');
    setFormTags([]);
    setFormAttachments([]);
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

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get file icon based on type
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('sheet') || type.includes('excel')) return '📊';
    if (type.includes('zip') || type.includes('rar')) return '📦';
    return '📎';
  };

  // Handle file selection
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const maxSize = 10 * 1024 * 1024; // 10MB per file
    const maxTotalSize = 50 * 1024 * 1024; // 50MB total
    const allowedTypes = [
      'image/', 'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'application/zip', 'application/x-zip-compressed'
    ];

    const newAttachments: { name: string; size: number; url: string; type: string }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Check file size
      if (file.size > maxSize) {
        alert(`文件 "${file.name}" 超过 10MB 限制`);
        continue;
      }

      // Check total size
      const currentTotal = formAttachments.reduce((sum, a) => sum + a.size, 0);
      if (currentTotal + file.size > maxTotalSize) {
        alert('附件总大小不能超过 50MB');
        break;
      }

      // Create local URL for preview
      const url = URL.createObjectURL(file);
      newAttachments.push({
        name: file.name,
        size: file.size,
        url,
        type: file.type,
      });
    }

    setFormAttachments(prev => [...prev, ...newAttachments]);
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    const attachment = formAttachments[index];
    if (attachment.url.startsWith('blob:')) {
      URL.revokeObjectURL(attachment.url);
    }
    setFormAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  // Submit form
  const handleSubmit = async () => {
    if (!formTitle.trim()) {
      alert('请输入项目标题');
      return;
    }
    if (!formContent.trim()) {
      alert('请输入项目描述');
      return;
    }

    setIsSubmitting(true);

    // Create new project
    const selectedTags = tags.filter(tag => formTags.includes(tag.id));
    const newProject = {
      id: `p_${Date.now()}`,
      type: 'project' as const,
      title: formTitle.trim(),
      content: formContent.trim(),
      excerpt: formContent.trim().substring(0, 100) + '...',
      author: state.user,
      tags: selectedTags,
      likes: 0,
      views: 0,
      收藏: 0,
      comments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isFeatured: false,
      status: 'pending' as const,
      team: [state.user.name],
      metrics: {
        techScore: 0,
        users: 0,
        responseTime: '-',
      },
      attachments: formAttachments,
    };

    // Add to state
    dispatch({ type: 'ADD_PROJECT', payload: newProject });

    setIsSubmitting(false);
    closeModal();
    alert('项目发布成功！');
  };

  const filteredProjects = state.projects.filter((p) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'featured') return p.isFeatured;
    return p.status === activeTab;
  }).filter((p) => {
    if (searchQuery) {
      return p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             p.content.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const tabs = [
    { id: 'all', label: '全部项目' },
    { id: 'pending', label: '待审核' },
    { id: 'featured', label: '精选项目' },
    { id: 'online', label: '已上线' },
    { id: 'testing', label: '试运行' },
    { id: 'developing', label: '开发中' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Bot className="w-7 h-7 text-indigo-600" />
            AI Hub
          </h1>
          <p className="text-slate-500 mt-1">AI项目展厅，展示落地成果与创新实践</p>
        </div>
        <Button onClick={openModal}>
          <Plus className="w-4 h-4" />
          发布项目
        </Button>
      </div>

      {/* Tabs */}
      <Card padding="sm">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
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
          <div className="ml-auto">
            <Input
              placeholder="搜索项目..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
              className="w-48"
            />
          </div>
        </div>
      </Card>

      {/* Project Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredProjects.map((project) => {
          const statusInfo = getProjectStatusInfo(project.status);
          return (
            <Card key={project.id} hover className="group cursor-pointer overflow-hidden" onClick={() => setSelectedProject(project)}>
              {/* Project Cover */}
              <div className="relative h-40 -mx-4 -mt-4 mb-4 bg-gradient-to-br from-indigo-500 via-cyan-500 to-purple-500">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Bot className="w-16 h-16 text-white/50" />
                </div>
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-xs text-white font-medium">
                    AI
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <span
                    className="px-2 py-1 text-xs font-medium rounded-lg"
                    style={{
                      backgroundColor: `${statusInfo.color}20`,
                      color: statusInfo.color,
                    }}
                  >
                    {statusInfo.label}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {project.tags.slice(0, 2).map((tag) => (
                    <Tag key={tag.id} color={tag.color} size="sm">{tag.name}</Tag>
                  ))}
                </div>

                <h3 className="font-bold text-lg text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                  {project.title}
                </h3>

                <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                  {project.excerpt}
                </p>

                {/* Team */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex -space-x-2">
                    {project.team.slice(0, 3).map((member, i) => (
                      <Avatar key={i} name={member} size="sm" className="border-2 border-white" />
                    ))}
                    {project.team.length > 3 && (
                      <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs font-medium text-slate-600">
                        +{project.team.length - 3}
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-slate-500">团队</span>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl mb-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-indigo-600 font-semibold">
                      <Zap className="w-4 h-4" />
                      {project.metrics.techScore}
                    </div>
                    <div className="text-xs text-slate-400">技术评分</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-emerald-600 font-semibold">
                      <Users className="w-4 h-4" />
                      {formatNumber(project.metrics.users)}
                    </div>
                    <div className="text-xs text-slate-400">覆盖用户</div>
                  </div>
                  <div className="text-center">
                    <div className="text-slate-700 font-semibold">{project.metrics.responseTime}</div>
                    <div className="text-xs text-slate-400">响应速度</div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      {project.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {formatNumber(project.views)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(project.createdAt)}
                    </span>
                  </div>
                  {project.isFeatured && (
                    <span className="text-xs text-amber-500 font-medium">🔥 精选项目</span>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredProjects.length === 0 && (
        <Card className="text-center py-12">
          <Bot className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-600 mb-2">暂无相关项目</h3>
          <p className="text-sm text-slate-400 mb-4">成为第一个分享AI项目的人</p>
          <Button>发布项目</Button>
        </Card>
      )}

      {/* Stats Banner */}
      <Card className="bg-gradient-to-r from-indigo-600 to-cyan-600 border-none text-white">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold mb-1">{state.projects.length + 15}</div>
            <div className="text-sm text-white/70">已上线项目</div>
          </div>
          <div>
            <div className="text-3xl font-bold mb-1">{formatNumber(45600)}</div>
            <div className="text-sm text-white/70">累计覆盖用户</div>
          </div>
          <div>
            <div className="text-3xl font-bold mb-1">{formatNumber(8900)}</div>
            <div className="text-sm text-white/70">总点赞数</div>
          </div>
          <div>
            <div className="text-3xl font-bold mb-1">92%</div>
            <div className="text-sm text-white/70">平均技术评分</div>
          </div>
        </div>
      </Card>

      {/* Publish Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-cyan-50">
              <h2 className="text-lg font-semibold text-slate-900">发布项目</h2>
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
                  项目名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="请输入项目名称，例如：智能客服机器人"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-slate-900"
                  maxLength={100}
                />
              </div>

              {/* Content Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  项目描述 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="描述项目的核心功能、技术架构、使用场景等..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none text-slate-900"
                  rows={6}
                  maxLength={2000}
                />
              </div>

              {/* Tags Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  选择标签 <span className="text-xs text-slate-400 ml-2">(可多选)</span>
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

              {/* Attachments */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  附件上传 <span className="text-xs text-slate-400 ml-2">(可选)</span>
                </label>

                {/* Upload Area */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
                  }`}
                >
                  <Paperclip className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">
                    拖拽文件到此处，或 <span className="text-indigo-600 font-medium">点击上传</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    支持图片、PDF、Word、Excel、ZIP，单个文件不超过 10MB，总计不超过 50MB
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
                  />
                </div>

                {/* Attachment List */}
                {formAttachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {formAttachments.map((attachment, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xl">{getFileIcon(attachment.type)}</span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-700 truncate max-w-[200px]">
                              {attachment.name}
                            </p>
                            <p className="text-xs text-slate-400">{formatFileSize(attachment.size)}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeAttachment(index)}
                          className="p-1.5 hover:bg-red-100 rounded-lg transition-colors flex-shrink-0"
                          title="删除附件"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    ))}
                    <p className="text-xs text-slate-400">
                      共 {formAttachments.length} 个附件，{formatFileSize(formAttachments.reduce((sum, a) => sum + a.size, 0))}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 border-t border-slate-200 bg-slate-50">
              <div className="text-sm text-slate-500">
                <span className="flex items-center gap-2">
                  {formTags.length > 0 && (
                    <span>
                      <span className="text-indigo-600 font-medium">{formTags.length}</span> 个标签
                    </span>
                  )}
                  {formAttachments.length > 0 && (
                    <span>
                      <span className="text-indigo-600 font-medium">{formAttachments.length}</span> 个附件
                    </span>
                  )}
                </span>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={closeModal} disabled={isSubmitting}>
                  取消
                </Button>
                <Button
                  onClick={handleSubmit}
                  isLoading={isSubmitting}
                  disabled={isSubmitting || !formTitle.trim() || !formContent.trim()}
                >
                  {isSubmitting ? '发布中...' : '发布项目'}
                </Button>
              </div>
            </div>
          </div>
</div>
      )}

      {/* Project Detail Modal */}
      {selectedProject && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setSelectedProject(null)}
        >
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-cyan-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">项目详情</h2>
                  <p className="text-xs text-slate-500">{selectedProject.title}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Project Info */}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900 mb-2">{selectedProject.title}</h3>
                <div className="flex items-center gap-2 mb-4">
                  <Avatar name={selectedProject.author.name} size="sm" />
                  <span className="text-sm text-slate-600">{selectedProject.author.name}</span>
                  <span className="text-slate-400">·</span>
                  <span className="text-sm text-slate-500">{selectedProject.author.department}</span>
                  <span className="text-slate-400">·</span>
                  <span className="text-sm text-slate-500">{formatTimeAgo(selectedProject.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className="px-2 py-1 text-xs font-medium rounded-lg"
                    style={{
                      backgroundColor: `${getProjectStatusInfo(selectedProject.status).color}20`,
                      color: getProjectStatusInfo(selectedProject.status).color,
                    }}
                  >
                    {getProjectStatusInfo(selectedProject.status).label}
                  </span>
                  {selectedProject.tags.map((tag) => (
                    <Tag key={tag.id} color={tag.color} size="sm">{tag.name}</Tag>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-slate-700 mb-2">项目描述</h4>
                <div className="bg-slate-50 rounded-xl p-4 text-slate-700 whitespace-pre-wrap">
                  {selectedProject.content}
                </div>
              </div>

              {/* Team */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-slate-700 mb-2">团队成员</h4>
                <div className="flex items-center gap-2">
                  {selectedProject.team.map((member, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
                      <Avatar name={member} size="sm" />
                      <span className="text-sm text-slate-700">{member}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Attachments */}
              {selectedProject.attachments && selectedProject.attachments.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-slate-700 mb-2">附件下载</h4>
                  <div className="space-y-2">
                    {selectedProject.attachments.map((attachment, index) => (
                      <a
                        key={index}
                        href={attachment.url}
                        download={attachment.name}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{getFileIcon(attachment.type)}</span>
                          <div>
                            <p className="text-sm font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">
                              {attachment.name}
                            </p>
                            <p className="text-xs text-slate-400">{formatFileSize(attachment.size)}</p>
                          </div>
                        </div>
                        <Download className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Metrics */}
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-2">项目数据</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-50 rounded-xl p-4 text-center">
                    <div className="flex items-center justify-center gap-1 text-indigo-600 font-semibold text-lg">
                      <Zap className="w-4 h-4" />
                      {selectedProject.metrics.techScore}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">技术评分</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 text-center">
                    <div className="flex items-center justify-center gap-1 text-emerald-600 font-semibold text-lg">
                      <Users className="w-4 h-4" />
                      {formatNumber(selectedProject.metrics.users)}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">覆盖用户</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 text-center">
                    <div className="text-slate-700 font-semibold text-lg">{selectedProject.metrics.responseTime}</div>
                    <div className="text-xs text-slate-500 mt-1">响应速度</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 border-t border-slate-200 bg-slate-50">
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4" />
                  {selectedProject.likes} 点赞
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {formatNumber(selectedProject.views)} 浏览
                </span>
              </div>
              <Button variant="secondary" onClick={() => setSelectedProject(null)}>
                关闭
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
