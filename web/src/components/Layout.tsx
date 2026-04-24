import React from 'react';
import { Link } from 'react-router-dom';
import { Layout as LayoutIcon, Search, Settings, Lock } from 'lucide-react';
import LoginModal from './LoginModal';
import SettingsModal from './SettingsModal';

const Header: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [user, setUser] = React.useState<{ name: string } | null>(null);
  const [showSettingsModal, setShowSettingsModal] = React.useState(false);
  const [showLoginModal, setShowLoginModal] = React.useState(false);
  const [userSettings, setUserSettings] = React.useState({
    fontSize: 'medium',
    themeIntensity: 'warm',
    autoAnalyze: true
  });

  React.useEffect(() => {
    const savedSettings = localStorage.getItem('fin-settings');
    if (savedSettings) {
      setUserSettings(JSON.parse(savedSettings));
    }
  }, []);

  const updateSettings = (newSettings: Partial<typeof userSettings>) => {
    const updated = { ...userSettings, ...newSettings };
    setUserSettings(updated);
    localStorage.setItem('fin-settings', JSON.stringify(updated));
  };

  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('fin-user');
  };

  return (
    <>
      <header className="h-[40px] bg-claude-sidebar flex items-center justify-between px-4 z-50 shrink-0 select-none border-b border-claude-border">
        <div className="flex items-center gap-6 text-claude-text-primary text-[13px] font-semibold">
          <Link to="/" className="flex items-center gap-2 hover:opacity-70 cursor-pointer transition-opacity">
            <LayoutIcon className="w-4 h-4 text-claude-accent" />
            <span className="tracking-widest uppercase text-xs font-black">FINSIGHT</span>
          </Link>
          <div className="hidden md:flex gap-5 text-claude-text-secondary font-medium text-[12px]">
            <Link to="/" className="hover:text-claude-text-primary cursor-pointer transition-colors">Home</Link>
            <Link to="/market" className="hover:text-claude-text-primary cursor-pointer transition-colors">Market</Link>
            <Link to="/workbench" className="hover:text-claude-text-primary cursor-pointer transition-colors">Workbench</Link>
          </div>
        </div>

        <div className="flex-1 max-w-sm mx-auto relative group">
          <div className="bg-claude-sidebar rounded-md border border-claude-border px-4 py-1.5 flex items-center justify-center gap-2 group-hover:bg-claude-paper transition-all cursor-text translate-y-px">
            <Search className="w-3.5 h-3.5 text-claude-text-secondary opacity-50" />
            <span className="text-[12px] text-claude-text-secondary font-medium lowercase">贵州茅台 (600519) - 2024 年度报告摘要</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex gap-2 px-3 py-1 bg-claude-sidebar rounded-full border border-claude-border text-[11px] font-bold text-claude-text-secondary">
            <span className="text-claude-accent">PRO</span>
            <span className="opacity-40">|</span>
            <span>HS-182</span>
          </div>
          
          <div className="h-6 w-px bg-claude-border mx-1"></div>
          
          <button 
            onClick={() => setShowSettingsModal(true)}
            className="p-1.5 text-claude-text-secondary hover:text-claude-accent transition-colors rounded-md"
          >
            <Settings className="w-4 h-4" />
          </button>

          {isLoggedIn ? (
            <div className="flex items-center gap-3 pl-2">
              <div className="w-7 h-7 rounded-full bg-claude-accent/20 border border-claude-accent/30 flex items-center justify-center text-[10px] font-bold text-claude-accent uppercase">
                {user?.name.slice(0, 2)}
              </div>
              <button 
                onClick={handleLogout}
                className="text-[11px] font-bold text-claude-text-secondary hover:text-red-500 transition-colors"
              >
                LOGOUT
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowLoginModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-claude-accent text-white rounded-md text-[11px] font-bold hover:opacity-90 transition-all shadow-sm"
            >
              <Lock className="w-3.5 h-3.5" />
              LOGIN
            </button>
          )}
        </div>
      </header>
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} onLogin={() => {}} />}
      {showSettingsModal && <SettingsModal onClose={() => setShowSettingsModal(false)} settings={userSettings} onUpdate={updateSettings} />}
    </>
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-claude-paper text-claude-text-primary font-sans">
      <Header />
      <main className="flex-1 flex overflow-hidden">
        {children}
      </main>
    </div>
  );
};

export default Layout;
