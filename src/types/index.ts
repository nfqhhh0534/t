// 用户和认证相关类型
export interface User {
  id: string;
  name: string;
  avatar?: string;
  department: string;
  title: string;
  level: ReputationLevel;
  energy: number;
  answers: number;
  likes: number;
  reputation: number;
  badges: Badge[];
  isExpert: boolean;
  isAdmin?: boolean;
  expertFields?: string[];
  createdAt: Date;
}

export type ReputationLevel = 'newstar' | 'star' | 'moonlight' | 'sunshine' | 'supernova';

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlockedAt?: Date;
}

// 内容相关类型
export interface Content {
  id: string;
  type: ContentType;
  title: string;
  content: string;
  excerpt?: string;
  author: User;
  tags: Tag[];
  likes: number;
  views: number;
  收藏: number;
  comments: Comment[];
  createdAt: Date;
  updatedAt?: Date;
  isFeatured?: boolean;
  coverImage?: string;
}

export type ContentType = 'question' | 'project' | 'insight' | 'product';

export interface Question extends Omit<Content, 'comments'> {
  type: 'question';
  status: 'unresolved' | 'resolved';
  bounty?: number;
  acceptedAnswer?: Comment;
  answers: Comment[];
  comments: Comment[];
  isAnonymous?: boolean;
}

export interface Project extends Content {
  type: 'project';
  status: ProjectStatus;
  team: string[];
  metrics: ProjectMetrics;
  attachments?: { name: string; size: number; url: string; type: string }[];
}

export type ProjectStatus = 'pending' | 'researching' | 'developing' | 'testing' | 'online' | 'archived';

export interface ProjectMetrics {
  techScore: number;
  users: number;
  responseTime: string;
}

export interface Insight extends Content {
  type: 'insight';
  category: InsightCategory;
  editorPick?: boolean;
  editor?: User;
  sourceUrl?: string;
}

export type InsightCategory = 'industry' | 'tech' | 'topic' | 'book';

export interface Product extends Content {
  type: 'product';
  price: number;
  rating: number;
  reviews: number;
  category: ProductCategory;
}

export type ProductCategory = 'aitool' | 'dataset' | 'course' | 'merchandise' | 'service';

// 标签类型
export interface Tag {
  id: string;
  name: string;
  color?: string;
  count?: number;
}

// 评论类型
export interface Comment {
  id: string;
  content: string;
  author: User;
  likes: number;
  isAccepted?: boolean;
  createdAt: Date;
}

// 激励系统类型
export interface EnergyTransaction {
  id: string;
  amount: number;
  reason: string;
  type: 'earn' | 'spend';
  createdAt: Date;
}

export interface DailyActivity {
  date: string;
  count: number;
}

// 导航和布局类型
export type NavSection = 'home' | 'ask' | 'aihub' | 'insights' | 'market' | 'profile' | 'admin' | 'points' | 'login';

export interface NavItem {
  id: NavSection;
  label: string;
  icon: string;
}

// AI助手类型
export interface AIAssistantState {
  isOpen: boolean;
  messages: AIMessage[];
  currentAction?: AIAction;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export type AIAction = 'summarize' | 'search' | 'answer' | 'recommend';
