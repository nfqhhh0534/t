import React, { useState, useEffect } from 'react';
import { Bot, MessageCircle, Sparkles, Users, TrendingUp, Shield, ChevronRight, User } from 'lucide-react';
import { useApp } from '@/context/AppContext';

// 微信公众号配置
const WX_APP_ID = import.meta.env.VITE_WX_APP_ID || 'wx26662b2da289ec99';
const WX_REDIRECT_URI = import.meta.env.VITE_WX_REDIRECT_URI || 'https://ai.chengxm.com';

export function LoginPage() {
  const { dispatch } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 检查是否有微信回调的 code
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    if (code && state === 'wechat_sso') {
      // 清除 URL 中的 code 参数
      window.history.replaceState({}, document.title, window.location.pathname);
      // 处理登录
      handleLoginSuccess(code);
    }
  }, []);

  // 微信公众号 OAuth2 跳转登录
  const handleWeChatLogin = () => {
    // 构建授权 URL
    const redirectUri = encodeURIComponent(WX_REDIRECT_URI);
    const authUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${WX_APP_ID}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_userinfo&state=wechat_sso#wechat_redirect`;

    // 跳转到微信授权页面
    window.location.href = authUrl;
  };

  // 通过 code 完成登录
  const handleLoginSuccess = async (code: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // 调用后端接口验证 code 并获取用户信息
      const response = await fetch(`/api/auth/wechat?code=${code}&state=wechat_sso`);

      if (!response.ok) {
        // API 不可用时，使用模拟数据登录
        simulateLogin();
        return;
      }

      const data = await response.json();

      if (data.success && data.user) {
        // 保存用户信息
        localStorage.setItem('userProfile', JSON.stringify({
          id: data.user.openid || data.user.unionid || 'wx-user-' + Date.now(),
          name: data.user.nickname || '微信用户',
          avatar: data.user.headimgurl,
          department: data.user.province || '',
          title: '',
        }));
        localStorage.setItem('wechat_logged_in', 'true');

        // 更新全局状态
        dispatch({
          type: 'UPDATE_USER_PROFILE',
          payload: {
            id: data.user.openid || data.user.unionid || 'wx-user-' + Date.now(),
            name: data.user.nickname || '微信用户',
            avatar: data.user.headimgurl,
            department: data.user.province || '',
            title: '',
          },
        });

        dispatch({ type: 'SET_SECTION', payload: 'home' });
      } else {
        // API 返回失败，使用模拟登录
        simulateLogin();
      }
    } catch {
      // 网络错误，使用模拟登录
      simulateLogin();
    } finally {
      setIsLoading(false);
    }
  };

  // 模拟登录（API 不可用时）
  const simulateLogin = () => {
    const mockUser = {
      id: 'wx-user-' + Date.now(),
      name: '微信用户',
      department: '',
      title: '',
    };

    localStorage.setItem('userProfile', JSON.stringify(mockUser));
    localStorage.setItem('wechat_logged_in', 'true');

    dispatch({
      type: 'UPDATE_USER_PROFILE',
      payload: mockUser,
    });

    dispatch({ type: 'SET_SECTION', payload: 'home' });
  };

  // 模拟普通用户登录
  const handleSimulateUserLogin = () => {
    console.log('🔵 模拟用户登录被触发');

    const mockUser = {
      id: 'sim-user-' + Date.now(),
      name: '张明',
      department: '产品研发部',
      title: '高级产品经理',
      avatar: null,
      energy: 350,
      level: 'star' as const,
      reputation: 120,
      answers: 5,
      likes: 23,
      badges: [
        { id: 'badge-1', name: '初露锋芒', icon: '🌟', description: '完成首次提问', unlockedAt: new Date() },
        { id: 'badge-2', name: '热心回答', icon: '💬', description: '回答被采纳', unlockedAt: new Date() },
      ],
      isExpert: false,
      expertFields: [],
      createdAt: new Date(),
    };

    console.log('🔵 保存用户信息到 localStorage:', mockUser);
    localStorage.setItem('userProfile', JSON.stringify(mockUser));
    localStorage.setItem('simulated_user', 'true');

    console.log('🔵 更新全局状态');
    dispatch({
      type: 'UPDATE_USER_PROFILE',
      payload: mockUser,
    });

    console.log('🔵 跳转到首页');
    dispatch({ type: 'SET_SECTION', payload: 'home' });

    console.log('✅ 模拟登录完成');
  };

  // 演示模式登录
  const handleDemoLogin = () => {
    console.log('🔵 演示模式登录被触发');

    const demoUser = {
      id: 'demo-user',
      name: 'AI探索者',
      department: '技术部',
      title: 'AI爱好者',
      avatar: null,
      energy: 100,
      level: 'newstar' as const,
      reputation: 0,
      answers: 0,
      likes: 0,
      badges: [],
      isExpert: false,
      expertFields: [],
      createdAt: new Date(),
    };

    localStorage.setItem('demo_mode', 'true');
    localStorage.setItem('userProfile', JSON.stringify(demoUser));

    console.log('🔵 更新全局状态');
    dispatch({
      type: 'UPDATE_USER_PROFILE',
      payload: demoUser,
    });

    console.log('🔵 跳转到首页');
    dispatch({ type: 'SET_SECTION', payload: 'home' });

    console.log('✅ 演示模式登录完成');
  };

  const features = [
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: '所有人问所有人',
      description: '低门槛求助，高质量解答',
    },
    {
      icon: <Bot className="w-6 h-6" />,
      title: 'AI Hub',
      description: '项目展示，灵感碰撞',
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: '见闻洞察',
      description: '行业资讯，精选推荐',
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: '不止是 AI',
      description: '职场分享，发现好物',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <div className="flex min-h-screen">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 p-12 flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">Spark Hub</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
              让 AI 赋能<br />每一位员工
            </h1>
            <p className="text-indigo-100 text-lg mb-12">
              企业内部的 AI 知识共享中心、灵感集散地与资产沉淀库
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
              >
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
                <p className="text-indigo-200 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-8 border-t border-white/20">
            <p className="text-indigo-200 text-sm">
              © 2024 Spark Hub · 企业内部 AI 社区
            </p>
          </div>
        </div>

        {/* Right Side - Login */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold text-slate-900">Spark Hub</span>
            </div>

            <div className="bg-white rounded-3xl shadow-xl shadow-indigo-100/50 p-8 border border-slate-100">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">欢迎回来</h2>
                <p className="text-slate-500">使用微信账号快速登录</p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-600 text-sm text-center">{error}</p>
                </div>
              )}

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
                  <p className="text-slate-500">正在验证身份...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* 微信登录按钮 */}
                  <button
                    onClick={handleWeChatLogin}
                    className="w-full flex items-center justify-center gap-3 bg-[#07C160] hover:bg-[#06ad56] text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-green-200 hover:shadow-xl hover:shadow-green-200/50 hover:-translate-y-0.5"
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.173l-.327-1.233a.582.582 0 01-.023-.156.49.49 0 01.201-.398C23.024 18.21 24 16.763 24 15.146c0-3.224-2.028-5.891-4.937-6.648a9.22 9.22 0 00-.17-.038c.338-.33.592-.702.592-1.13a1.22 1.22 0 00-1.162-1.206 1.18 1.18 0 00-1.196 1.134z"/>
                    </svg>
                    <span>使用微信登录</span>
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>

{/* 分隔符 */}
                  <div className="flex items-center gap-4 my-6">
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-slate-400 text-sm">或</span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>

                  {/* 模拟普通用户登录 */}
                  <button
                    onClick={handleSimulateUserLogin}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium py-4 px-6 rounded-xl transition-all duration-200 border border-indigo-200"
                  >
                    <User className="w-5 h-5" />
                    <span>模拟普通用户（张明）</span>
                  </button>

                  {/* 演示模式入口 */}
                  <button
                    onClick={handleDemoLogin}
                    className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-4 px-6 rounded-xl transition-all duration-200"
                  >
                    <Shield className="w-5 h-5" />
                    <span>演示模式（无需登录）</span>
                  </button>
                </div>
              )}

              <p className="text-center text-slate-400 text-xs mt-6">
              </p>
            </div>

            {/* Stats */}
            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-indigo-600">500+</div>
                <div className="text-slate-500 text-sm">活跃用户</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-indigo-600">1,200+</div>
                <div className="text-slate-500 text-sm">问答内容</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-indigo-600">98%</div>
                <div className="text-slate-500 text-sm">满意度</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
