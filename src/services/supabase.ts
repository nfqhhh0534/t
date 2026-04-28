import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase is properly configured
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey &&
  supabaseUrl !== '' && supabaseAnonKey !== '';

// Client for all operations (RLS disabled on Supabase)
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

// Database types matching our existing types
export interface DbQuestion {
  id: string;
  title: string;
  content: string;
  author_id: string;
  status: 'unresolved' | 'resolved';
  bounty: number | null;
  likes: number;
  views: number;
  收藏: number;
  created_at: string;
  updated_at: string;
  is_anonymous: boolean;
}

export interface DbQuestionTag {
  question_id: string;
  tag_id: string;
}

export interface DbTag {
  id: string;
  name: string;
  color: string;
  count: number;
}

export interface DbUser {
  id: string;
  name: string;
  department: string;
  position: string;
  avatar: string | null;
  energy: number;
  level: string;
  reputation: number;
}

// 判断是否是 CORS 或网络错误
function isNetworkError(error: any): boolean {
  if (!error) return false;
  const message = error.message || '';
  const code = error.code || '';

  return (
    message.includes('Failed to fetch') ||
    message.includes('NetworkError') ||
    message.includes('Network request failed') ||
    code === 'CORS_ERROR' ||
    message.includes('Access to fetch')
  );
}

// CRUD operations for Questions
export const questionsApi = {
  // Get all questions (uses anon key for public read)
  async getAll(): Promise<any[] | null> {
    // 如果 Supabase 未配置，直接返回 null
    if (!supabase) {
      console.log('⚠️ Supabase 未配置，跳过数据库查询');
      return null;
    }

    try {
      console.log('📡 Fetching questions from:', supabaseUrl);

      // First, try a simple query to test connectivity
      const { data: simpleData, error: simpleError } = await supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (simpleError) {
        console.error('❌ Simple query error:', simpleError);

        // 如果是网络/CORS 错误，返回 null 让调用方使用本地数据
        if (isNetworkError(simpleError)) {
          console.log('⚠️ 网络错误，将使用本地数据');
          return null;
        }
        throw simpleError;
      }

      console.log('📊 Simple query returned:', simpleData?.length || 0, 'questions');

      // Now try the full query with joins
      const { data, error } = await supabase
        .from('questions')
        .select(`
          *,
          question_tags(tags(*)),
          profiles(name, department, position, avatar, energy, level)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Full query error:', error);

        // 如果是网络/CORS 错误，返回 null
        if (isNetworkError(error)) {
          console.log('⚠️ 网络错误，将使用本地数据');
          return null;
        }

        // If full query fails, return simple data
        console.log('📊 Falling back to simple query results');
        return simpleData;
      }

      console.log('📊 questionsApi.getAll returned:', data?.length || 0, 'questions');
      return data;
    } catch (error) {
      console.error('❌ questionsApi.getAll exception:', error);

      // 如果是网络/CORS 错误，返回 null
      if (isNetworkError(error)) {
        console.log('⚠️ 网络/CORS 错误，将使用本地数据');
        return null;
      }

      throw error;
    }
  },

  // Create a new question
  async create(question: {
    title: string;
    content: string;
    author_id: string;
    bounty?: number;
    tag_ids: string[];
    is_anonymous?: boolean;
  }) {
    // Insert question (RLS is disabled, so regular client works)
    const { data: questionData, error: questionError } = await supabase
      .from('questions')
      .insert({
        title: question.title,
        content: question.content,
        author_id: question.author_id,
        bounty: question.bounty || null,
        status: 'unresolved',
        likes: 0,
        views: 0,
        收藏: 0,
        is_anonymous: question.is_anonymous || false,
      })
      .select()
      .single();

    if (questionError) throw questionError;

    // Insert question-tag relationships
    if (question.tag_ids.length > 0) {
      const tagRelations = question.tag_ids.map(tag_id => ({
        question_id: questionData.id,
        tag_id,
      }));

      const { error: tagError } = await supabase
        .from('question_tags')
        .insert(tagRelations);

      if (tagError) throw tagError;
    }

    return questionData;
  },

  // Update question
  async update(id: string, updates: Partial<DbQuestion>) {
    const { data, error } = await supabase
      .from('questions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete question
  async delete(id: string) {
    // First delete tag relations
    await supabase.from('question_tags').delete().eq('question_id', id);

    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Toggle like
  async toggleLike(id: string, currentLikes: number) {
    const { data, error } = await supabase
      .from('questions')
      .update({ likes: currentLikes + 1 })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// Tags API
export const tagsApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('count', { ascending: false });

    if (error) throw error;
    return data;
  },
};

// User profiles API
export const profilesApi = {
  async getById(id: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async getAll() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async create(profile: {
    name: string;
    department: string;
    position: string;
  }) {
    // Generate a new UUID for the user
    const newId = crypto.randomUUID();

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: newId,
        name: profile.name,
        department: profile.department,
        position: profile.position,
        energy: 100,
        level: 'newstar',
        reputation: 2000, // 初始化声望为2000
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<DbUser & { is_admin?: boolean }>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// Insights API
export const insightsApi = {
  async getAll(): Promise<any[] | null> {
    // 如果 Supabase 未配置，直接返回 null
    if (!supabase) {
      console.log('⚠️ Supabase 未配置，跳过数据库查询');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('insights')
        .select('*, profiles(name, department, position, avatar)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Insights query error:', error);
        // 如果是网络/CORS 错误，返回 null
        if (isNetworkError(error)) {
          console.log('⚠️ 网络错误，将使用本地数据');
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('❌ Insights API exception:', error);
      // 如果是网络/CORS 错误，返回 null
      if (isNetworkError(error)) {
        return null;
      }
      throw error;
    }
  },

  async create(insight: {
    title: string;
    content: string;
    excerpt: string;
    category: string;
    author_id: string;
    editor_pick?: boolean;
    source_url?: string;
  }) {
    if (!supabase) {
      console.log('⚠️ Supabase 未配置，跳过创建');
      return null;
    }

    const { data, error } = await supabase
      .from('insights')
      .insert({
        title: insight.title,
        content: insight.content,
        excerpt: insight.excerpt,
        category: insight.category,
        author_id: insight.author_id,
        editor_pick: insight.editor_pick || false,
        is_featured: false,
        likes: 0,
        views: 0,
        source_url: insight.source_url || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: {
    editor_pick?: boolean;
    is_featured?: boolean;
  }) {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('insights')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    if (!supabase) return;

    const { error } = await supabase
      .from('insights')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// Answers API
export const answersApi = {
  async getByQuestionId(questionId: string) {
    const { data, error } = await supabase
      .from('answers')
      .select('*, profiles(name, department, position, avatar, energy, level)')
      .eq('question_id', questionId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  async create(answer: {
    question_id: string;
    author_id: string;
    content: string;
  }) {
    const { data, error } = await supabase
      .from('answers')
      .insert({
        question_id: answer.question_id,
        author_id: answer.author_id,
        content: answer.content,
        likes: 0,
        is_accepted: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: {
    content?: string;
    is_accepted?: boolean;
    likes?: number;
  }) {
    const { data, error } = await supabase
      .from('answers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('answers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async toggleAccept(id: string) {
    // First get the current status
    const { data: current, error: fetchError } = await supabase
      .from('answers')
      .select('is_accepted')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Toggle the status
    const { data, error } = await supabase
      .from('answers')
      .update({ is_accepted: !current.is_accepted })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
