import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { User, NavSection, Question, Project, ProjectStatus, Insight, InsightCategory, Product, AIAssistantState, Tag, Comment, Badge } from '@/types';
import { currentUser, guestUser, questions, projects, insights, products, tags } from '@/data/mockData';
import { supabase, questionsApi, tagsApi, insightsApi, answersApi, profilesApi } from '@/services/supabase';
import { BADGE_DEFINITIONS, UserStats, getNewBadges, toBadge } from '@/data/badges';

// 通知类型
export type NotificationType =
  | 'answer_received'      // 收到新回答
  | 'answer_accepted'      // 回答被采纳
  | 'like_received'       // 收到点赞
  | 'follow_received'     // 被关注
  | 'badge_earned'        // 获得徽章
  | 'points_earned'       // 积分变动
  | 'insight_picked'      // 见闻被精选
  | 'system';             // 系统通知

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  sourceId?: string;     // 相关内容的ID
  sourceType?: 'question' | 'answer' | 'insight' | 'user';
  isRead: boolean;
  createdAt: Date;
}

// 能量积分历史记录类型
export interface PointHistory {
  id: string;
  amount: number;
  type: 'earn' | 'spend';
  reason: PointReason;
  sourceId?: string;
  sourceTitle?: string;
  createdAt: Date;
}

export type PointReason =
  | 'post_question'       // 发布问题
  | 'post_answer'         // 发布回答
  | 'answer_accepted'     // 回答被采纳
  | 'receive_like'        // 收到点赞
  | 'give_like'           // 送出点赞
  | 'receive_follow'       // 被关注
  | 'daily_login'         // 每日登录
  | 'post_insight'        // 发布见闻
  | 'insight_picked'      // 见闻被主编精选
  | 'bounty_reward'       // 悬赏奖励
  | 'bounty_spent'        // 悬赏消耗
  | 'exchange_reward'     // 兑换奖励
  | 'system_bonus';       // 系统奖励

// 积分获取规则配置
export const POINT_RULES = {
  post_question: { earn: 5, desc: '发布问题' },
  post_answer: { earn: 10, desc: '发布回答' },
  answer_accepted: { earn: 25, desc: '回答被采纳' },
  receive_like: { earn: 2, desc: '回答被点赞' },
  give_like: { earn: -1, desc: '点赞消耗' },
  receive_follow: { earn: 5, desc: '被关注' },
  daily_login: { earn: 10, desc: '每日登录' },
  post_insight: { earn: 15, desc: '发布见闻' },
  insight_picked: { earn: 50, desc: '见闻被精选' },
  bounty_reward: { earn: 0, desc: '悬赏获得' },
  bounty_spent: { earn: 0, desc: '悬赏消耗' },
  exchange_reward: { earn: 0, desc: '兑换奖励' },
  system_bonus: { earn: 0, desc: '系统奖励' },
} as const;

// 状态类型
interface AppState {
  user: User;
  currentSection: NavSection;
  questions: Question[];
  projects: Project[];
  insights: Insight[];
  products: Product[];
  tags: typeof tags;
  aiAssistant: AIAssistantState;
  likedItems: Set<string>;
  collectedItems: Set<string>;
  followedUsers: Set<string>; // 关注的用户ID集合
  notifications: AppNotification[]; // 通知列表
  isLoading: boolean;
  isDbConnected: boolean;
  openAskModal: boolean; // 控制是否打开发布提问模态框
  pointHistory: PointHistory[]; // 积分历史记录
  dailyActivities: { date: string; count: number }[]; // 每日活动数据（用于贡献图）
}

// Action类型
type AppAction =
  | { type: 'SET_SECTION'; payload: NavSection }
  | { type: 'TOGGLE_LIKE'; payload: string }
  | { type: 'TOGGLE_COLLECT'; payload: string }
  | { type: 'TOGGLE_FOLLOW'; payload: string }
  | { type: 'UPDATE_USER_PROFILE'; payload: Partial<User> }
  | { type: 'ADD_QUESTION'; payload: Question }
  | { type: 'UPDATE_QUESTION'; payload: { id: string; updates: Partial<Question> } }
  | { type: 'SET_QUESTIONS'; payload: Question[] }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: { id: string; updates: Partial<Project> } }
  | { type: 'APPROVE_PROJECT'; payload: { id: string; status: ProjectStatus } }
  | { type: 'ADD_INSIGHT'; payload: Insight }
  | { type: 'SET_INSIGHTS'; payload: Insight[] }
  | { type: 'TOGGLE_AI_ASSISTANT' }
  | { type: 'ADD_AI_MESSAGE'; payload: { role: 'user' | 'assistant'; content: string } }
  | { type: 'SET_AI_ACTION'; payload: AIAssistantState['currentAction'] | undefined }
  | { type: 'CLEAR_AI_MESSAGES' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_DB_CONNECTED'; payload: boolean }
  | { type: 'SET_OPEN_ASK_MODAL'; payload: boolean }
  | { type: 'ADD_POINT_HISTORY'; payload: PointHistory }
  | { type: 'UPDATE_USER_ENERGY'; payload: number }
  | { type: 'UPDATE_USER_REPUTATION'; payload: number }
  | { type: 'ADD_BADGE'; payload: { userId: string; badge: Badge } }
  | { type: 'UPDATE_DAILY_ACTIVITY'; payload: { date: string; count: number } }
  | { type: 'SET_POINT_HISTORY'; payload: PointHistory[] }
  | { type: 'ADD_NOTIFICATION'; payload: AppNotification }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'MARK_ALL_NOTIFICATIONS_READ' }
  | { type: 'SET_NOTIFICATIONS'; payload: AppNotification[] }
  | { type: 'DELETE_NOTIFICATION'; payload: string };

// 生成最近365天的活动数据
const generateDailyActivities = (): { date: string; count: number }[] => {
  const activities = [];
  const today = new Date();
  for (let i = 364; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    // 随机生成0-10之间的活动数，模拟真实数据
    const random = Math.random();
    const count = random > 0.3 ? Math.floor(Math.random() * 10) + 1 : 0;
    activities.push({ date: dateStr, count });
  }
  return activities;
};

// 从localStorage加载持久化数据
const loadPersistedData = () => {
  try {
    const liked = localStorage.getItem('likedItems');
    const collected = localStorage.getItem('collectedItems');
    const followed = localStorage.getItem('followedUsers');
    const userProfile = localStorage.getItem('userProfile');
    // 检查所有可能的登录状态
    const isWeChatLoggedIn = localStorage.getItem('wechat_logged_in') === 'true';
    const isDemoMode = localStorage.getItem('demo_mode') === 'true';
    const isSimulatedUser = localStorage.getItem('simulated_user') === 'true';
    const isLoggedIn = isWeChatLoggedIn || isDemoMode || isSimulatedUser;

    // 加载用户信息 - 只有登录或演示模式才加载用户数据
    let user = guestUser;
    if (isLoggedIn && userProfile) {
      const savedProfile = JSON.parse(userProfile);
      user = { ...currentUser, ...savedProfile };
    } else if (isLoggedIn) {
      // 如果登录了但没有profile，使用currentUser
      user = currentUser;
    }

    return {
      likedItems: liked ? new Set<string>(JSON.parse(liked)) : new Set<string>(),
      collectedItems: collected ? new Set<string>(JSON.parse(collected)) : new Set<string>(),
      followedUsers: followed ? new Set<string>(JSON.parse(followed)) : new Set<string>(),
      user,
    };
  } catch (e) {
    console.error('Failed to load persisted data:', e);
    return {
      likedItems: new Set<string>(),
      collectedItems: new Set<string>(),
      followedUsers: new Set<string>(),
      user: guestUser,
    };
  }
};

const persistedData = loadPersistedData();

// 从 localStorage 加载通知
const loadNotifications = (): AppNotification[] => {
  try {
    const saved = localStorage.getItem('notifications');
    if (saved) {
      const parsed = JSON.parse(saved);
      // 转换日期字符串为 Date 对象
      return parsed.map((n: any) => ({
        ...n,
        createdAt: new Date(n.createdAt),
      }));
    }
  } catch (e) {
    console.error('Failed to load notifications:', e);
  }
  // 返回默认通知
  return [];
};

// 从 localStorage 加载项目列表
const loadProjects = (): Project[] => {
  try {
    const saved = localStorage.getItem('projects');
    if (saved) {
      const parsed = JSON.parse(saved);
      // 转换日期字符串为 Date 对象
      return parsed.map((p: any) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        updatedAt: p.updatedAt ? new Date(p.updatedAt) : undefined,
        author: {
          ...p.author,
          createdAt: p.author?.createdAt ? new Date(p.author.createdAt) : new Date(),
        },
      }));
    }
  } catch (e) {
    console.error('Failed to load projects:', e);
  }
  // 回退到 mock 数据
  return projects;
};

// 初始状态
const initialState: AppState = {
  user: persistedData.user,
  currentSection: 'home',
  questions: questions,
  projects: loadProjects(),
  insights: insights,
  products: products,
  tags: tags,
  aiAssistant: {
    isOpen: false,
    messages: [],
    currentAction: undefined,
  },
  likedItems: persistedData.likedItems,
  collectedItems: persistedData.collectedItems,
  followedUsers: persistedData.followedUsers,
  notifications: loadNotifications(),
  isLoading: false,
  isDbConnected: false,
  openAskModal: false,
  pointHistory: [], // 积分历史记录
  dailyActivities: generateDailyActivities(), // 每日活动数据
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_SECTION':
      return { ...state, currentSection: action.payload };

    case 'TOGGLE_LIKE': {
      const newLikedItems = new Set(state.likedItems);
      if (newLikedItems.has(action.payload)) {
        newLikedItems.delete(action.payload);
      } else {
        newLikedItems.add(action.payload);
      }
      return { ...state, likedItems: newLikedItems };
    }

    case 'TOGGLE_COLLECT': {
      const newCollectedItems = new Set(state.collectedItems);
      if (newCollectedItems.has(action.payload)) {
        newCollectedItems.delete(action.payload);
      } else {
        newCollectedItems.add(action.payload);
      }
      return { ...state, collectedItems: newCollectedItems };
    }

    case 'TOGGLE_FOLLOW': {
      const newFollowedUsers = new Set(state.followedUsers);
      if (newFollowedUsers.has(action.payload)) {
        newFollowedUsers.delete(action.payload);
      } else {
        newFollowedUsers.add(action.payload);
      }
      return { ...state, followedUsers: newFollowedUsers };
    }

    case 'UPDATE_USER_PROFILE': {
      const newUser = { ...state.user, ...action.payload };
      // 持久化用户信息到localStorage
      try {
        localStorage.setItem('userProfile', JSON.stringify({
          name: newUser.name,
          department: newUser.department,
          title: newUser.title,
        }));
      } catch (e) {
        console.error('Failed to save user profile:', e);
      }
      return { ...state, user: newUser };
    }

    case 'ADD_QUESTION':
      return { ...state, questions: [action.payload, ...state.questions] };

    case 'UPDATE_QUESTION':
      return {
        ...state,
        questions: state.questions.map(q =>
          q.id === action.payload.id ? { ...q, ...action.payload.updates } : q
        ),
      };

    case 'SET_QUESTIONS':
      return { ...state, questions: action.payload };

    case 'ADD_PROJECT':
      return { ...state, projects: [action.payload, ...state.projects] };

    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === action.payload.id ? { ...p, ...action.payload.updates } : p
        ),
      };

    case 'APPROVE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === action.payload.id ? { ...p, status: action.payload.status } : p
        ),
      };

    case 'ADD_INSIGHT':
      return { ...state, insights: [action.payload, ...state.insights] };

    case 'SET_INSIGHTS':
      return { ...state, insights: action.payload };

    case 'TOGGLE_AI_ASSISTANT':
      return {
        ...state,
        aiAssistant: {
          ...state.aiAssistant,
          isOpen: !state.aiAssistant.isOpen,
        },
      };

    case 'ADD_AI_MESSAGE':
      return {
        ...state,
        aiAssistant: {
          ...state.aiAssistant,
          messages: [
            ...state.aiAssistant.messages,
            {
              id: Date.now().toString(),
              role: action.payload.role,
              content: action.payload.content,
              timestamp: new Date(),
            },
          ],
        },
      };

    case 'SET_AI_ACTION':
      return {
        ...state,
        aiAssistant: {
          ...state.aiAssistant,
          currentAction: action.payload,
        },
      };

    case 'CLEAR_AI_MESSAGES':
      return {
        ...state,
        aiAssistant: {
          ...state.aiAssistant,
          messages: [],
          currentAction: undefined,
        },
      };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_DB_CONNECTED':
      return { ...state, isDbConnected: action.payload };

    case 'SET_OPEN_ASK_MODAL':
      return { ...state, openAskModal: action.payload };

    case 'ADD_POINT_HISTORY':
      return {
        ...state,
        pointHistory: [action.payload, ...state.pointHistory],
      };

    case 'SET_POINT_HISTORY':
      return { ...state, pointHistory: action.payload };

    case 'UPDATE_USER_ENERGY':
      return {
        ...state,
        user: { ...state.user, energy: action.payload },
      };

    case 'UPDATE_USER_REPUTATION':
      return {
        ...state,
        user: { ...state.user, reputation: action.payload },
      };

    case 'ADD_BADGE': {
      if (action.payload.userId === state.user.id) {
        return {
          ...state,
          user: {
            ...state.user,
            badges: [...state.user.badges, action.payload.badge],
          },
        };
      }
      return state;
    }

    case 'UPDATE_DAILY_ACTIVITY': {
      const existingIndex = state.dailyActivities.findIndex(
        a => a.date === action.payload.date
      );
      if (existingIndex >= 0) {
        const newActivities = [...state.dailyActivities];
        newActivities[existingIndex] = action.payload;
        return { ...state, dailyActivities: newActivities };
      }
      return {
        ...state,
        dailyActivities: [...state.dailyActivities, action.payload],
      };
    }

    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
      };

    case 'MARK_NOTIFICATION_READ': {
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.payload ? { ...n, isRead: true } : n
        ),
      };
    }

    case 'MARK_ALL_NOTIFICATIONS_READ':
      return {
        ...state,
        notifications: state.notifications.map(n => ({ ...n, isRead: true })),
      };

    case 'SET_NOTIFICATIONS':
      return {
        ...state,
        notifications: action.payload,
      };

    case 'DELETE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
      };

    default:
      return state;
  }
}

// Transform database insight to our Insight type
function transformDbInsight(dbInsight: any): Insight {
  const authorData = dbInsight.profiles;
  return {
    type: 'insight' as const,
    id: dbInsight.id,
    title: dbInsight.title,
    content: dbInsight.content,
    excerpt: dbInsight.excerpt || dbInsight.content?.substring(0, 100) + '...',
    category: dbInsight.category as InsightCategory,
    author: authorData ? {
      id: dbInsight.author_id,
      name: authorData.name || '匿名用户',
      department: authorData.department || '未知部门',
      title: authorData.position || '未知职位',
      avatar: authorData.avatar,
      energy: authorData.energy || 0,
      level: authorData.level || '新星',
      answers: 0,
      likes: 0,
      reputation: 0,
      badges: [],
      isExpert: false,
      createdAt: new Date(),
    } : {
      id: dbInsight.author_id,
      name: '匿名用户',
      department: '未知部门',
      title: '未知职位',
      avatar: null,
      energy: 0,
      level: '新星',
      answers: 0,
      likes: 0,
      reputation: 0,
      badges: [],
      isExpert: false,
      createdAt: new Date(),
    },
    tags: [] as Tag[],
    comments: [] as Comment[],
    收藏: dbInsight.收藏 || 0,
    editorPick: dbInsight.editor_pick || false,
    isFeatured: dbInsight.is_featured || false,
    likes: dbInsight.likes || 0,
    views: dbInsight.views || 0,
    createdAt: new Date(dbInsight.created_at),
    updatedAt: new Date(dbInsight.updated_at),
    sourceUrl: dbInsight.source_url || undefined,
  };
}

// Transform database question to our Question type
function transformDbQuestion(dbQuestion: any): Question {
  // Check if the question is anonymous
  const isAnonymous = dbQuestion.is_anonymous || false;

  // Handle author from profiles table or use default
  const authorData = dbQuestion.profiles;
  // If anonymous, show "匿名用户" regardless of actual author
  const author = isAnonymous ? {
    id: dbQuestion.author_id,
    name: '匿名用户',
    department: '未知部门',
    position: '未知职位',
    avatar: null,
    energy: 0,
    level: '新星' as const,
    answers: 0,
    likes: 0,
    reputation: 0,
    badges: [],
    isExpert: false,
    expertFields: [],
    createdAt: new Date(),
    title: '',
  } : authorData ? {
    id: dbQuestion.author_id,
    name: authorData.name || '匿名用户',
    department: authorData.department || '未知部门',
    position: authorData.position || '未知职位',
    avatar: authorData.avatar,
    energy: authorData.energy || 0,
    level: authorData.level || '新星',
    answers: 0,
    likes: 0,
    reputation: 0,
    badges: [],
    isExpert: false,
    expertFields: [],
    createdAt: new Date(),
    title: authorData.position || '',
  } : {
    id: dbQuestion.author_id,
    name: '匿名用户',
    department: '未知部门',
    position: '未知职位',
    avatar: null,
    energy: 0,
    level: '新星',
    answers: 0,
    likes: 0,
    reputation: 0,
    badges: [],
    isExpert: false,
    expertFields: [],
    createdAt: new Date(),
    title: '',
  };

  // Handle tags - question_tags contains tag objects
  let tags: any[] = [];
  if (dbQuestion.question_tags && Array.isArray(dbQuestion.question_tags)) {
    tags = dbQuestion.question_tags
      .map((qt: any) => {
        // If qt has tags directly (nested select), use it
        if (qt.tags) return qt.tags;
        // If qt itself is the tag object
        if (qt.name) return qt;
        return null;
      })
      .filter(Boolean);
  }

  return {
    id: dbQuestion.id,
    type: 'question',
    title: dbQuestion.title,
    content: dbQuestion.content,
    author,
    tags,
    createdAt: new Date(dbQuestion.created_at),
    updatedAt: new Date(dbQuestion.updated_at),
    likes: dbQuestion.likes || 0,
    views: dbQuestion.views || 0,
    comments: [],
    status: dbQuestion.status || 'unresolved',
    bounty: dbQuestion.bounty || undefined,
    answers: [],
    收藏: dbQuestion.收藏 || 0,
    isAnonymous,
  };
}

// Answer type for database transformation
interface DbAnswer {
  id: string;
  question_id: string;
  author_id: string;
  content: string;
  likes: number;
  is_accepted: boolean;
  created_at: string;
  updated_at: string;
  profiles?: {
    name: string;
    department: string;
    position: string;
    avatar: string | null;
    energy: number;
    level: string;
  };
}

// Transform database answer to our Answer type
function transformDbAnswer(dbAnswer: DbAnswer, authorUser: User) {
  const profileData = dbAnswer.profiles;
  return {
    id: dbAnswer.id,
    content: dbAnswer.content,
    author: profileData ? {
      id: dbAnswer.author_id,
      name: profileData.name || authorUser.name,
      department: profileData.department || authorUser.department,
      title: profileData.position || authorUser.title,
      avatar: profileData.avatar || undefined,
      energy: profileData.energy || 0,
      level: profileData.level || '新星',
      answers: 0,
      likes: 0,
      reputation: 0,
      badges: [],
      isExpert: false,
      expertFields: [],
      createdAt: new Date(),
      position: profileData.position || authorUser.title,
    } : authorUser,
    likes: dbAnswer.likes || 0,
    isAccepted: dbAnswer.is_accepted || false,
    createdAt: new Date(dbAnswer.created_at),
  };
}

// Context
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  createQuestion: (question: Omit<Question, 'id' | 'type' | 'author' | 'createdAt' | 'updatedAt' | 'likes' | 'views' | 'comments' | 'answers' | 'status' | '收藏'> & { tagIds: string[] }) => Promise<Question | null>;
  createInsight: (insight: { title: string; content: string; excerpt: string; category: string; source_url?: string }) => Promise<Insight | null>;
  createAnswer: (questionId: string, content: string) => Promise<any | null>;
  fetchAnswersForQuestion: (questionId: string) => Promise<any[]>;
  syncQuestions: () => Promise<void>;
  earnPoints: (reason: PointReason, amount?: number, sourceId?: string, sourceTitle?: string) => void;
  checkAndAwardBadges: () => void;
  addNotification: (notification: Omit<AppNotification, 'id' | 'isRead' | 'createdAt'>) => void;
  unreadCount: number;
} | null>(null);

// Provider
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Initialize: Try to connect to Supabase and fetch questions
  useEffect(() => {
    const initDb = async () => {
      try {
        console.log('🔵 Starting database initialization...');

        // Try to fetch questions from Supabase (graceful degradation)
        console.log('🔵 Fetching questions from database...');
        const dbQuestions = await questionsApi.getAll();
        console.log('🔵 Raw questions from DB:', dbQuestions);

        if (dbQuestions && dbQuestions.length > 0) {
          const transformedQuestions = dbQuestions.map(transformDbQuestion);
          console.log('🔵 Transformed questions:', transformedQuestions);
          dispatch({ type: 'SET_QUESTIONS', payload: transformedQuestions });
          dispatch({ type: 'SET_DB_CONNECTED', payload: true });
          console.log('✅ Connected to Supabase database, loaded', transformedQuestions.length, 'questions');
        } else {
          // Database is empty, unreachable, or CORS blocked - use mock data
          dispatch({ type: 'SET_DB_CONNECTED', payload: false });
          console.log('📦 Using mock data (database unreachable or CORS blocked)');
        }

        // Try to fetch insights from Supabase
        try {
          console.log('🔵 Fetching insights from database...');
          const dbInsights = await insightsApi.getAll();
          console.log('🔵 Raw insights from DB:', dbInsights);

          if (dbInsights && dbInsights.length > 0) {
            const transformedInsights = dbInsights.map(transformDbInsight);
            console.log('🔵 Transformed insights:', transformedInsights);
            dispatch({ type: 'SET_INSIGHTS', payload: transformedInsights });
            console.log('✅ Loaded', transformedInsights.length, 'insights from database');
          } else {
            console.log('📦 No insights in database, using mock data');
          }
        } catch (insightError) {
          console.warn('⚠️ Failed to load insights:', insightError);
        }
      } catch (error) {
        // Database tables may not exist yet or CORS blocked
        console.error('❌ Database initialization error:', error);
        dispatch({ type: 'SET_DB_CONNECTED', payload: false });
      }
    };

    initDb();
  }, []);

  // Create question - always try to save to database
  const createQuestion = async (
    questionData: Omit<Question, 'id' | 'type' | 'author' | 'createdAt' | 'updatedAt' | 'likes' | 'views' | 'comments' | 'answers' | 'status' | '收藏'> & { tagIds: string[]; isAnonymous?: boolean }
  ): Promise<Question | null> => {
    console.log('🔵 createQuestion called with:', questionData);
    console.log('🔵 Current user ID:', state.user.id);

    const isAnonymous = questionData.isAnonymous || false;

    // If anonymous, show "匿名用户" as the author
    const authorForQuestion = isAnonymous ? {
      ...state.user,
      name: '匿名用户',
      department: '未知部门',
      title: '未知职位',
    } : state.user;

    const newQuestion: Question = {
      id: `q_${Date.now()}`,
      type: 'question',
      title: questionData.title,
      content: questionData.content,
      author: authorForQuestion,
      tags: questionData.tags,
      createdAt: new Date(),
      updatedAt: new Date(),
      likes: 0,
      views: 0,
      comments: [],
      status: 'unresolved',
      bounty: questionData.bounty,
      answers: [],
      收藏: 0,
      isAnonymous,
    };

    // Always add to local state first for immediate feedback
    dispatch({ type: 'ADD_QUESTION', payload: newQuestion });
    console.log('🔵 Added question to local state');

    // 给予发布问题积分奖励
    earnPoints('post_question');

    // Always try to sync with database (regardless of isDbConnected status)
    try {
      console.log('🔵 Attempting to save to database...');
      const result = await questionsApi.create({
        title: questionData.title,
        content: questionData.content,
        author_id: state.user.id,
        bounty: questionData.bounty,
        tag_ids: questionData.tagIds,
        is_anonymous: isAnonymous,
      });
      console.log('✅ Question saved to database:', result);
    } catch (error: any) {
      // Log detailed error information
      console.error('❌ Database save failed:', error);
      console.error('Error message:', error?.message);
      console.error('Error details:', error?.details);
      console.error('Error hint:', error?.hint);
    }

    return newQuestion;
  };

  // Create insight - add to local state and try to save to database
  const createInsight = async (
    insightData: { title: string; content: string; excerpt: string; category: string; source_url?: string }
  ): Promise<Insight | null> => {
    console.log('🔵 createInsight called with:', insightData);

    const newInsight: Insight = {
      type: 'insight',
      id: `insight_${Date.now()}`,
      title: insightData.title,
      content: insightData.content,
      excerpt: insightData.excerpt || insightData.content.substring(0, 100) + '...',
      category: insightData.category as InsightCategory,
      author: state.user,
      tags: [],
      comments: [],
      收藏: 0,
      editorPick: false,
      isFeatured: false,
      likes: 0,
      views: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      sourceUrl: insightData.source_url,
    };

    // Always add to local state first for immediate feedback
    dispatch({ type: 'ADD_INSIGHT', payload: newInsight });
    console.log('🔵 Added insight to local state');

    // Try to save to database
    try {
      const result = await insightsApi.create({
        title: insightData.title,
        content: insightData.content,
        excerpt: insightData.excerpt,
        category: insightData.category,
        author_id: state.user.id,
        source_url: insightData.source_url,
      });
      console.log('✅ Insight saved to database:', result);
    } catch (error: any) {
      console.error('❌ Database save failed for insight:', error);
    }

    return newInsight;
  };

  // Create answer - add to local state and try to save to database
  const createAnswer = async (
    questionId: string,
    content: string
  ): Promise<any | null> => {
    console.log('🔵 createAnswer called with:', { questionId, content });

    // Get current answers before adding new one
    const question = state.questions.find(q => q.id === questionId);
    const currentAnswers = question?.answers || [];

    const newAnswer = {
      id: `answer_${Date.now()}`,
      content: content,
      author: state.user,
      likes: 0,
      isAccepted: false,
      createdAt: new Date(),
    };

    // Add new answer to local state immediately
    dispatch({
      type: 'UPDATE_QUESTION',
      payload: {
        id: questionId,
        updates: {
          answers: [...currentAnswers, newAnswer],
        }
      }
    });
    console.log('🔵 Added answer to local state');

    // 给予发布回答积分奖励
    earnPoints('post_answer');

    // Try to save to database
    try {
      const result = await answersApi.create({
        question_id: questionId,
        author_id: state.user.id,
        content: content,
      });
      console.log('✅ Answer saved to database:', result);

      // Update the local answer with the real database ID if successful
      if (result) {
        // Use the new answers array (with newAnswer) to update the ID
        const updatedAnswers = [...currentAnswers, newAnswer].map((a: any) =>
          a.id === newAnswer.id ? { ...a, id: result.id } : a
        );
        dispatch({
          type: 'UPDATE_QUESTION',
          payload: {
            id: questionId,
            updates: {
              answers: updatedAnswers,
            }
          }
        });
      }
    } catch (error: any) {
      console.error('❌ Database save failed for answer:', error);
    }

    return newAnswer;
  };

  // Fetch answers for a specific question from database
  const fetchAnswersForQuestion = async (questionId: string): Promise<any[]> => {
    try {
      const dbAnswers = await answersApi.getByQuestionId(questionId);
      if (dbAnswers && dbAnswers.length > 0) {
        const transformedAnswers = dbAnswers.map((dbAnswer: DbAnswer) =>
          transformDbAnswer(dbAnswer, state.user)
        );
        console.log('🔵 Fetched answers from DB:', transformedAnswers.length);

        // Always update with the fetched answers from database
        dispatch({
          type: 'UPDATE_QUESTION',
          payload: {
            id: questionId,
            updates: {
              answers: transformedAnswers as any,
            }
          }
        });

        return transformedAnswers;
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch answers:', error);
      return [];
    }
  };

  // Sync questions from database
  const syncQuestions = async () => {
    if (!state.isDbConnected) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const dbQuestions = await questionsApi.getAll();

      if (dbQuestions && dbQuestions.length > 0) {
        const transformedQuestions = dbQuestions.map(transformDbQuestion);
        dispatch({ type: 'SET_QUESTIONS', payload: transformedQuestions });
      }
    } catch (error) {
      console.error('Failed to sync questions:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // 积分获取函数 - 支持异步数据库同步
  const earnPoints = useCallback((
    reason: PointReason,
    customAmount?: number,
    sourceId?: string,
    sourceTitle?: string
  ) => {
    const rule = POINT_RULES[reason];
    const amount = customAmount ?? rule.earn;

    if (amount === 0 && reason !== 'bounty_reward' && reason !== 'bounty_spent' && reason !== 'exchange_reward' && reason !== 'system_bonus') {
      // 如果是悬赏或兑换等自定义金额操作，amount由调用方指定
      return;
    }

    const type: 'earn' | 'spend' = amount >= 0 ? 'earn' : 'spend';

    // 创建积分记录
    const pointRecord: PointHistory = {
      id: `ph_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount: Math.abs(amount),
      type,
      reason,
      sourceId,
      sourceTitle,
      createdAt: new Date(),
    };

    // 添加到历史记录
    dispatch({ type: 'ADD_POINT_HISTORY', payload: pointRecord });

    // 计算新的能量值和声望值
    const newEnergy = state.user.energy + amount;
    const updatedEnergy = Math.max(0, newEnergy);

    let newReputation = state.user.reputation;
    if (type === 'earn' && reason !== 'give_like') {
      newReputation = state.user.reputation + amount;
    }

    // 更新本地状态
    dispatch({ type: 'UPDATE_USER_ENERGY', payload: updatedEnergy });
    if (type === 'earn' && reason !== 'give_like') {
      dispatch({ type: 'UPDATE_USER_REPUTATION', payload: newReputation });
    }

    // 更新每日活动
    const today = new Date().toISOString().split('T')[0];
    const todayActivity = state.dailyActivities.find(a => a.date === today);
    const currentCount = todayActivity?.count || 0;
    dispatch({
      type: 'UPDATE_DAILY_ACTIVITY',
      payload: { date: today, count: currentCount + 1 }
    });

    // 同步到数据库
    const syncToDatabase = async () => {
      try {
        console.log(`🔄 同步积分到数据库: energy=${updatedEnergy}, reputation=${newReputation}`);
        await profilesApi.update(state.user.id, {
          energy: updatedEnergy,
          reputation: newReputation,
        });
        console.log('✅ 积分同步到数据库成功');
      } catch (error) {
        console.error('❌ 积分同步到数据库失败:', error);
      }
    };

    syncToDatabase();

    console.log(`🎯 积分变动: ${type === 'earn' ? '+' : '-'}${Math.abs(amount)} (${rule.desc})`);
  }, [state.user.energy, state.user.reputation, state.user.id, state.dailyActivities, dispatch]);

  // 计算用户统计数据
  const calculateUserStats = useCallback((): UserStats => {
    // 计算用户发布的问答数
    const userQuestions = state.questions.filter(q => q.author.id === state.user.id);
    const userAnswers = state.questions.flatMap(q => q.answers || []).filter(a => a.author.id === state.user.id);
    const acceptedAnswers = userAnswers.filter(a => a.isAccepted);

    // 计算用户收到的总赞数
    const questionLikes = userQuestions.reduce((sum, q) => sum + q.likes, 0);
    const answerLikes = userAnswers.reduce((sum, a) => sum + a.likes, 0);
    const totalLikes = questionLikes + answerLikes;

    // 计算用户发布的见闻和项目数
    const userInsights = state.insights.filter(i => i.author.id === state.user.id);
    const userProjects = state.projects.filter(p => p.author.id === state.user.id);

    // 计算连续活跃天数
    const today = new Date().toISOString().split('T')[0];
    const sortedActivities = [...state.dailyActivities].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    let consecutiveDays = 0;
    let currentDate = new Date();

    for (let i = 0; i < 365; i++) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const activity = sortedActivities.find(a => a.date === dateStr);
      if (activity && activity.count > 0) {
        consecutiveDays++;
      } else if (dateStr !== today) {
        break;
      }
      currentDate.setDate(currentDate.getDate() - 1);
    }

    return {
      totalQuestions: userQuestions.length,
      totalAnswers: userAnswers.length,
      acceptedAnswers: acceptedAnswers.length,
      totalLikes,
      totalViews: userQuestions.reduce((sum, q) => sum + q.views, 0),
      insightsCount: userInsights.length,
      projectsCount: userProjects.length,
      consecutiveDays,
      dailyActivities: sortedActivities.filter(a => a.count > 0).length,
      currentStreak: consecutiveDays,
    };
  }, [state.questions, state.insights, state.projects, state.user.id, state.dailyActivities]);

  // 检查并授予新徽章
  const checkAndAwardBadges = useCallback(() => {
    const stats = calculateUserStats();
    const currentBadges = state.user.badges;
    const existingBadgeIds = new Set(currentBadges.map(b => b.id));

    // 检查每个徽章定义，看是否满足条件但尚未获得
    const newBadges: Badge[] = [];

    BADGE_DEFINITIONS.forEach(badgeDef => {
      if (!existingBadgeIds.has(badgeDef.id)) {
        if (badgeDef.condition(state.user, stats)) {
          const badge = toBadge(badgeDef);
          badge.unlockedAt = new Date();
          newBadges.push(badge);

          // 添加到用户徽章列表
          dispatch({
            type: 'ADD_BADGE',
            payload: { userId: state.user.id, badge },
          });

          console.log(`🏅 获得新徽章: ${badge.name} - ${badge.description}`);
        }
      }
    });

    // 如果有新徽章，显示通知
    if (newBadges.length > 0) {
      const badgeNames = newBadges.map(b => b.name).join('、');
      // 可以在这里触发通知系统的调用
      // notifyNewBadges(newBadges);
    }
  }, [state.user, calculateUserStats, dispatch]);

  // 每日登录奖励
  useEffect(() => {
    const checkDailyLogin = () => {
      const lastLoginKey = 'lastLoginDate';
      const today = new Date().toISOString().split('T')[0];
      const lastLogin = localStorage.getItem(lastLoginKey);

      if (lastLogin !== today) {
        // 新的一天，给予登录奖励
        earnPoints('daily_login');
        localStorage.setItem(lastLoginKey, today);
      }
    };

    checkDailyLogin();
  }, [earnPoints]);

  // 检查徽章（在登录、发布内容等关键操作后触发）
  useEffect(() => {
    // 延迟执行，确保状态已更新
    const timer = setTimeout(() => {
      checkAndAwardBadges();
    }, 100);
    return () => clearTimeout(timer);
  }, [state.user.energy, state.user.reputation, state.questions.length, state.insights.length]);

  // 持久化点赞、收藏、关注数据到localStorage
  useEffect(() => {
    try {
      localStorage.setItem('likedItems', JSON.stringify([...state.likedItems]));
    } catch (e) {
      console.error('Failed to save likedItems:', e);
    }
  }, [state.likedItems]);

  useEffect(() => {
    try {
      localStorage.setItem('collectedItems', JSON.stringify([...state.collectedItems]));
    } catch (e) {
      console.error('Failed to save collectedItems:', e);
    }
  }, [state.collectedItems]);

  useEffect(() => {
    try {
      localStorage.setItem('followedUsers', JSON.stringify([...state.followedUsers]));
    } catch (e) {
      console.error('Failed to save followedUsers:', e);
    }
  }, [state.followedUsers]);

  // 持久化通知到localStorage
  useEffect(() => {
    try {
      localStorage.setItem('notifications', JSON.stringify(state.notifications));
    } catch (e) {
      console.error('Failed to save notifications:', e);
    }
  }, [state.notifications]);

  // 持久化项目列表到localStorage
  useEffect(() => {
    try {
      localStorage.setItem('projects', JSON.stringify(state.projects));
    } catch (e) {
      console.error('Failed to save projects:', e);
    }
  }, [state.projects]);

  // 添加通知函数
  const addNotification = useCallback((
    notification: Omit<AppNotification, 'id' | 'isRead' | 'createdAt'>
  ) => {
    const newNotification: AppNotification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      isRead: false,
      createdAt: new Date(),
    };
    dispatch({ type: 'ADD_NOTIFICATION', payload: newNotification });
    console.log(`🔔 新通知: ${newNotification.title} - ${newNotification.message}`);
  }, [dispatch]);

  // 计算未读通知数量
  const unreadCount = state.notifications.filter(n => !n.isRead).length;

  return (
    <AppContext.Provider value={{ state, dispatch, createQuestion, createInsight, createAnswer, fetchAnswersForQuestion, syncQuestions, earnPoints, checkAndAwardBadges, addNotification, unreadCount }}>
      {children}
    </AppContext.Provider>
  );
}

// Hook
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
