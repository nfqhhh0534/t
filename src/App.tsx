import { useState } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import { Header, Sidebar, RightSidebar, MobileNav, AIAssistant } from '@/components/layout';
import { HomePage, AskPage, AIHubPage, InsightsPage, MarketPage, ProfilePage, AdminPage, PointsPage } from '@/components/pages';
import { AICompassModal } from '@/components/ui/AICompass';
import { LoginPage } from '@/components/pages/LoginPage';

function MainContent() {
  const { state } = useApp();
  const [showAICompass, setShowAICompass] = useState(false);

  // 检查登录状态
  const isLoggedIn = localStorage.getItem('demo_mode') === 'true' || localStorage.getItem('wechat_logged_in') === 'true';

  // 检查是否有微信回调
  const hasWeChatCallback = (() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('state') === 'wechat_sso' && params.get('code');
  })();

  // 显示登录页：未登录 或者 有微信回调
  const shouldShowLogin = state.currentSection === 'login' || (!isLoggedIn || hasWeChatCallback);

  // 渲染登录页
  if (shouldShowLogin) {
    return <LoginPage />;
  }

  const renderPage = () => {
    switch (state.currentSection) {
      case 'home':
        return <HomePage />;
      case 'ask':
        return <AskPage />;
      case 'aihub':
        return <AIHubPage />;
      case 'insights':
        return <InsightsPage />;
      case 'market':
        return <MarketPage />;
      case 'profile':
        return <ProfilePage />;
      case 'admin':
        return <AdminPage />;
      case 'points':
        return <PointsPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <AIAssistant />

      <div className="pt-16 pb-20 lg:pb-6">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-6">
          <div className="flex gap-6">
            <Sidebar onOpenAICompass={() => setShowAICompass(true)} />
            <main className="flex-1 min-w-0">
              {renderPage()}
            </main>
            <RightSidebar />
          </div>
        </div>
      </div>

      <MobileNav />

      {/* AI Compass Modal - 渲染在根层级，避免被遮挡 */}
      <AICompassModal
        isOpen={showAICompass}
        onClose={() => setShowAICompass(false)}
      />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}

export default App;
