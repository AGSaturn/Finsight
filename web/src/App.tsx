import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  Search, 
  Plus, 
  X, 
  FileText, 
  MessageSquare, 
  StickyNote, 
  BookOpen, 
  Star, 
  Folder, 
  MoreVertical,
  Zap,
  Save,
  Copy,
  Layout,
  Terminal,
  Activity,
  Coins,
  ShieldCheck,
  History,
  Command,
  Maximize2,
  Info,
  User,
  Settings,
  LogOut,
  Settings2,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { MOCK_REPORTS } from './data';
import { FinancialData, ChatMessage, Note } from './types';

// Mock model selection for better context
const MODEL_NAME = "gemini-3-flash-preview";

export default function App() {
  const [leftSidebarVisible, setLeftSidebarVisible] = useState(true);
  const [rightSidebarVisible, setRightSidebarVisible] = useState(true);
  const [leftWidth, setLeftWidth] = useState(260);
  const [rightWidth, setRightWidth] = useState(340);
  const [activeTabId, setActiveTabId] = useState<string>(MOCK_REPORTS[0].ticker);
  const [openTabs, setOpenTabs] = useState<string[]>([MOCK_REPORTS[0].ticker]);
  const [selection, setSelection] = useState<{ text: string, x: number, y: number } | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [isNoteDirty, setIsNoteDirty] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ email: string; name: string } | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [userSettings, setUserSettings] = useState({
    fontSize: 'medium',
    themeIntensity: 'warm',
    autoAnalyze: true
  });

  // Load from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('fin-user');
    const savedSettings = localStorage.getItem('fin-settings');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setIsLoggedIn(true);
    }
    if (savedSettings) {
      setUserSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleLogin = (email: string) => {
    const mockUser = { email, name: email.split('@')[0] };
    setUser(mockUser);
    setIsLoggedIn(true);
    setShowLoginModal(false);
    localStorage.setItem('fin-user', JSON.stringify(mockUser));
  };

  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('fin-user');
  };

  const updateSettings = (newSettings: Partial<typeof userSettings>) => {
    const updated = { ...userSettings, ...newSettings };
    setUserSettings(updated);
    localStorage.setItem('fin-settings', JSON.stringify(updated));
  };

  const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! }), []);
  const mainRef = useRef<HTMLDivElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const activeReport = useMemo(() => 
    MOCK_REPORTS.find(r => r.ticker === activeTabId) || MOCK_REPORTS[0]
  , [activeTabId]);

// Selection Tracker
  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      const sel = window.getSelection();
      const text = sel?.toString().trim();
      if (text) {
        setSelection({ text, x: e.clientX, y: e.clientY });
      } else {
        // Delay clearing to allow clicking selection bubble
        setTimeout(() => {
          if (!window.getSelection()?.toString().trim()) {
            setSelection(null);
          }
        }, 100);
      }
    };
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const scrollToSource = (sourceId: string) => {
    const el = document.getElementById(sourceId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('bg-sky-100/50');
      setTimeout(() => el.classList.remove('bg-sky-100/50'), 2000);
    }
  };

  const handleAskAI = async (input: string, contextOverride?: string) => {
    const context = contextOverride || selection?.text;
    const fullPrompt = context ? `Context: ${context}\n\nQuestion: ${input}` : input;
    
    setChatHistory(prev => [...prev, { role: 'user', content: input }]);
    setIsTyping(true);
    setSelection(null);

    try {
      const result = await ai.getGenerativeModel({ model: MODEL_NAME }).generateContent({
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
        systemInstruction: "You are a professional financial analyst. Provide clear, data-driven answers. Focus on identifying trends, risks, and key metrics. If context is provided, prioritize it. Maintain a technical yet authoritative tone. Use markdown formatting for clarity. When quoting values, mention if they are based on specific reports.",
      });
      
      const response = await result.response;
      const responseText = response.text() || "Insufficient data for detailed analysis.";
      setChatHistory(prev => [...prev, { role: 'assistant', content: responseText, sources: context ? [activeReport.period] : [] }]);
    } catch (error) {
      console.error(error);
      setChatHistory(prev => [...prev, { role: 'assistant', content: "INTELLIGENCE NODE ERROR: Link interrupted." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const openReport = (ticker: string) => {
    if (!openTabs.includes(ticker)) {
      setOpenTabs([...openTabs, ticker]);
    }
    setActiveTabId(ticker);
  };

  const closeTab = (ticker: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTabs = openTabs.filter(t => t !== ticker);
    setOpenTabs(newTabs);
    if (activeTabId === ticker && newTabs.length > 0) {
      setActiveTabId(newTabs[newTabs.length - 1]);
    }
  };

  const addNote = () => {
    if (!selection) return;
    const newNote: Note = {
      id: Math.random().toString(36).substr(2, 9),
      fileId: activeTabId,
      text: "",
      selection: selection.text,
      timestamp: Date.now(),
    };
    setNotes([...notes, newNote]);
    setSelection(null);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-claude-paper text-claude-text-primary font-sans">
      {/* Top Navigation - Claude Style White Header */}
      <header className="h-[40px] bg-claude-sidebar flex items-center justify-between px-4 z-50 shrink-0 select-none border-b border-claude-border">
        <div className="flex items-center gap-6 text-claude-text-primary text-[13px] font-semibold">
          <div className="flex items-center gap-2 hover:opacity-70 cursor-pointer transition-opacity">
            <Layout className="w-4 h-4 text-claude-accent" />
            <span className="tracking-widest uppercase text-xs font-black">FINSIGHT IDE</span>
          </div>
          <div className="hidden md:flex gap-5 text-claude-text-secondary font-medium text-[12px]">
            <span className="hover:text-claude-text-primary cursor-pointer transition-colors">Dashboard</span>
            <span className="hover:text-claude-text-primary cursor-pointer transition-colors">Research</span>
            <span className="hover:text-claude-text-primary cursor-pointer transition-colors">Notes</span>
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

      {/* Login Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8 border border-claude-border"
            >
              <div className="flex flex-col items-center mb-8">
                <div className="w-16 h-16 bg-claude-accent/10 rounded-2xl flex items-center justify-center mb-4">
                  <Layout className="w-8 h-8 text-claude-accent" />
                </div>
                <h2 className="text-xl font-bold text-[#101828]">FinSight Account</h2>
                <p className="text-sm text-claude-text-secondary mt-1">Sign in to sync your analysis stack</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-claude-text-secondary uppercase tracking-widest mb-1.5 block">Email Address</label>
                  <input 
                    type="email" 
                    placeholder="analyst@finsight.ai"
                    className="w-full px-4 py-3 bg-claude-sidebar border border-claude-border rounded-xl focus:outline-none focus:border-claude-accent transition-all text-sm font-medium"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleLogin(e.currentTarget.value);
                    }}
                  />
                </div>
                <button 
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling?.querySelector('input');
                    if (input) handleLogin(input.value);
                  }}
                  className="w-full py-3 bg-claude-accent text-white rounded-xl font-bold text-sm shadow-lg shadow-claude-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Continue to Workspace
                </button>
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-claude-border"></div></div>
                  <div className="relative flex justify-center"><span className="bg-white px-2 text-[10px] text-claude-text-secondary font-bold">OR</span></div>
                </div>
                <button 
                  onClick={() => handleLogin('google_user@gmail.com')}
                  className="w-full py-3 bg-white border border-claude-border rounded-xl font-bold text-sm flex items-center justify-center gap-3 hover:bg-claude-sidebar transition-all"
                >
                  <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
                  Sign in with Google
                </button>
              </div>
              
              <button 
                onClick={() => setShowLoginModal(false)}
                className="mt-6 w-full text-center text-[12px] font-bold text-claude-text-secondary hover:text-claude-text-primary transition-colors"
              >
                Maybe Later
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-0 border border-claude-border overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-claude-border flex items-center justify-between bg-claude-sidebar">
                <div className="flex items-center gap-2 font-bold text-[14px]">
                  <Settings2 className="w-4 h-4 text-claude-accent" />
                  Workbench Configuration
                </div>
                <X className="w-4 h-4 text-claude-text-secondary cursor-pointer hover:text-claude-text-primary" onClick={() => setShowSettingsModal(false)} />
              </div>

              <div className="p-8 space-y-8">
                <section>
                  <h3 className="text-[11px] font-bold text-claude-accent uppercase tracking-[0.2em] mb-4">Reading Environment</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div>
                        <label className="text-[12px] font-bold text-claude-text-secondary block mb-2">Font Scale</label>
                        <div className="flex bg-claude-sidebar p-1 rounded-lg border border-claude-border">
                          {['small', 'medium', 'large'].map(size => (
                            <button 
                              key={size}
                              onClick={() => updateSettings({ fontSize: size as any })}
                              className={`flex-1 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${userSettings.fontSize === size ? 'bg-white shadow-sm text-claude-accent' : 'text-claude-text-secondary hover:text-claude-text-primary'}`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[12px] font-bold text-claude-text-secondary block mb-2">Editor Theme</label>
                        <div className="flex bg-claude-sidebar p-1 rounded-lg border border-claude-border">
                          {['warm', 'classic', 'high-con'].map(theme => (
                            <button 
                              key={theme}
                              onClick={() => updateSettings({ themeIntensity: theme as any })}
                              className={`flex-1 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${userSettings.themeIntensity === theme ? 'bg-white shadow-sm text-claude-accent' : 'text-claude-text-secondary hover:text-claude-text-primary'}`}
                            >
                              {theme}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-[11px] font-bold text-claude-accent uppercase tracking-[0.2em] mb-4">AI Copilot Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-claude-sidebar rounded-xl border border-claude-border">
                      <div>
                        <div className="text-[13px] font-bold text-claude-text-primary">Auto-Analysis on Selection</div>
                        <div className="text-[11px] text-claude-text-secondary mt-0.5 font-medium">Automatically trigger summary when text is selected.</div>
                      </div>
                      <div 
                        onClick={() => updateSettings({ autoAnalyze: !userSettings.autoAnalyze })}
                        className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${userSettings.autoAnalyze ? 'bg-claude-accent' : 'bg-claude-text-secondary/20'}`}
                      >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${userSettings.autoAnalyze ? 'right-1' : 'left-1'}`}></div>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="bg-claude-accent/5 p-4 rounded-xl border border-claude-accent/10">
                  <div className="flex gap-3">
                    <ShieldCheck className="w-4 h-4 text-claude-accent shrink-0" />
                    <div>
                      <div className="text-[12px] font-bold text-claude-accent">Data Privacy Protection</div>
                      <div className="text-[11px] text-claude-accent/70 mt-1 font-medium leading-relaxed">
                        Your research data and configurations are stored locally in this browser. Personal analysis stacks are not shared with Gemini unless explicitly queried.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="px-8 py-5 bg-claude-sidebar border-t border-claude-border flex justify-end">
                <button 
                  onClick={() => setShowSettingsModal(false)}
                  className="px-6 py-2 bg-claude-accent text-white rounded-full text-[13px] font-bold shadow-lg shadow-claude-accent/20 hover:scale-[1.02] transition-all"
                >
                  Save Workspace
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar: Claude Explorer */}
        <AnimatePresence>
          {leftSidebarVisible && (
            <motion.aside 
              initial={{ width: 0 }}
              animate={{ width: leftWidth }}
              exit={{ width: 0 }}
              className="border-r border-claude-border bg-claude-ai flex flex-col shrink-0 overflow-hidden relative"
            >
              <div className="h-[35px] flex items-center px-4 justify-between border-b border-claude-border shrink-0 bg-claude-sidebar">
                <span className="text-[10px] font-black text-claude-text-secondary uppercase tracking-[0.2em]">Resource Browser</span>
                <div className="flex gap-2">
                   <Plus className="w-3.5 h-3.5 text-claude-text-secondary cursor-pointer hover:text-claude-accent" />
                   <MoreVertical className="w-3.5 h-3.5 text-claude-text-secondary cursor-pointer" />
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto py-2">
                <ExplorerFolder title="PORTFOLIO" icon={Coins} defaultOpen>
                  <ExplorerFolder title="CONSUMER SECTOR" icon={Folder}>
                    <ExplorerFolder title="Moutai (600519)" icon={Activity} active={activeTabId === '600519'}>
                      <ExplorerFolder title="基本信息" icon={Info}>
                        <ExplorerFile title="AI 简要分析" icon={Zap} />
                      </ExplorerFolder>
                      <ExplorerFolder title="财报" icon={FileText} defaultOpen>
                        <ExplorerFile 
                          title="2024 年度报告" 
                          active={activeTabId === '600519'} 
                          onClick={() => openReport('600519')}
                          status="opened"
                        />
                        <ExplorerFile title="2024 Q1 季度报告" />
                      </ExplorerFolder>
                      <ExplorerFolder title="笔记" icon={StickyNote}>
                        <ExplorerFile title="核心壁垒分析" icon={StickyNote} />
                      </ExplorerFolder>
                    </ExplorerFolder>
                    <ExplorerFolder title="Apple (AAPL)" icon={Layout}>
                      <ExplorerFolder title="基本信息" icon={Info}>
                        <ExplorerFile title="AI 简要分析" icon={Zap} />
                      </ExplorerFolder>
                      <ExplorerFolder title="财报" icon={FileText} defaultOpen>
                        <ExplorerFile 
                          title="2024 Q1 10-K" 
                          active={activeTabId === 'AAPL'} 
                          onClick={() => openReport('AAPL')}
                        />
                      </ExplorerFolder>
                      <ExplorerFolder title="笔记" icon={StickyNote}>
                        <ExplorerFile title="Competitor Analysis" icon={StickyNote} />
                      </ExplorerFolder>
                    </ExplorerFolder>
                  </ExplorerFolder>
                </ExplorerFolder>

                <div className="mt-8">
                  <ExplorerFolder title="RECENT ANALYSIS">
                    <ExplorerFile title="Moutai Net Margin YoY" />
                    <ExplorerFile title="Apple Services Growth" />
                  </ExplorerFolder>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Workbench: Tabs and Reader */}
        <main className="workbench-container relative" ref={mainRef}>
          {/* Tabs - Claude Warm Tabs */}
          <div className="h-[35px] bg-claude-sidebar flex items-center overflow-x-auto no-scrollbar shrink-0 border-b border-claude-border">
            {openTabs.map(ticker => {
              const report = MOCK_REPORTS.find(r => r.ticker === ticker);
              const isDirty = isNoteDirty[ticker];
              return (
                <div 
                  key={ticker}
                  onClick={() => setActiveTabId(ticker)}
                  className={`vscode-tab ${activeTabId === ticker ? 'vscode-tab-active' : ''}`}
                >
                  <FileText className={`w-3.5 h-3.5 ${activeTabId === ticker ? 'text-claude-accent' : 'opacity-40'}`} />
                  <span className="whitespace-nowrap font-medium tracking-tight">{report?.company || ticker}</span>
                  {isDirty && <div className="w-1.5 h-1.5 rounded-full bg-claude-accent ml-1"></div>}
                  <X 
                    className="w-3.5 h-3.5 hover:bg-black/5 rounded-full p-0.5 ml-2 transition-colors" 
                    onClick={(e) => closeTab(ticker, e)}
                  />
                </div>
              );
            })}
          </div>

          {/* Reader Area */}
          <div className="flex-1 overflow-y-auto bg-claude-paper flex flex-col items-center py-12">
            <div className="w-full max-w-4xl bg-claude-paper min-h-[140vh] p-20">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTabId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="mb-20 border-b-2 border-[#EEEEEE] pb-10">
                      <h1 className="text-[32px] font-bold text-[#101828] mb-6 font-sans tracking-tight">{activeReport.company}</h1>
                      <div className="flex items-center gap-8 text-[11px] font-bold text-claude-text-secondary tracking-[0.2em] uppercase">
                        <span className="flex items-center gap-2 text-claude-accent bg-claude-accent/5 px-2 py-1 rounded">RESEARCH_NODE_v4</span>
                        <span>PERIOD: {activeReport.period}</span>
                        <span>TICKER: {activeReport.ticker}.SH</span>
                      </div>
                    </div>
                    
                    <div className={`leading-[1.9] text-claude-text-primary font-serif selection:bg-[#D9EFFF] ${
                      userSettings.fontSize === 'small' ? 'text-[15.5px]' : 
                      userSettings.fontSize === 'large' ? 'text-[19.5px]' : 'text-[17.5px]'
                    }`}>
                      {activeReport.content.split('\n').map((line, i) => {
                        const lineNotes = notes.filter(n => n.fileId === activeTabId && line.includes(n.selection));
                        
                        let content: React.ReactNode;
                        if (line.startsWith('# ')) content = <h1 className="text-[26px] font-bold mt-16 mb-8 text-[#101828] border-b-2 border-[#EEEEEE] pb-4 uppercase tracking-wider">{line.replace('# ', '')}</h1>;
                        else if (line.startsWith('## ')) content = <h2 className="text-[20px] font-bold mt-14 mb-6 text-claude-accent font-sans">{line.replace('## ', '')}</h2>;
                        else if (line.startsWith('### ')) content = <h3 className="text-[18px] font-bold mt-10 mb-4 text-[#101828] font-sans border-l-2 border-claude-accent pl-4">{line.replace('### ', '')}</h3>;
                        else if (line.startsWith('- ')) content = <li className="ml-6 list-none mb-4 flex items-start gap-4">
                            <span className="w-1.5 h-1.5 rounded-full bg-claude-accent mt-3 shrink-0"></span>
                            <span>{line.replace('- ', '')}</span>
                          </li>;
                        else {
                          const parts = line.split(/(\*\*.*?\*\*)/g);
                          content = (
                            <p className="mb-10 text-justify">
                              {parts.map((part, pi) => {
                                if (part.startsWith('**') && part.endsWith('**')) {
                                  return (
                                    <span key={pi} className="font-mono font-bold bg-[#FFF9C4] px-1 py-0.5 rounded-sm mx-0.5 text-[0.95em] text-black">
                                      {part.slice(2, -2)}
                                    </span>
                                  );
                                }
                                return part;
                              })}
                            </p>
                          );
                        }

                        return (
                          <div key={i} id={`source-${i}`} className="relative group transition-colors duration-500 rounded px-2 -mx-2">
                             {content}
                            {lineNotes.map(note => (
                              <InlineNote key={note.id} note={note} onUpdate={(text) => {
                                setNotes(notes.map(n => n.id === note.id ? { ...n, text } : n));
                                setIsNoteDirty(prev => ({ ...prev, [activeTabId]: true }));
                              }} onDelete={() => {
                                setNotes(notes.filter(n => n.id !== note.id));
                              }} />
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                </AnimatePresence>
            </div>
          </div>

          {/* Selection Bubble - Claude Floating Pill */}
          <AnimatePresence>
            {selection && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                style={{ 
                  position: 'fixed', 
                  left: selection.x, 
                  top: selection.y - 65,
                  zIndex: 100 
                }}
                className="floating-pill"
              >
                <div className="flex px-1 gap-1">
                  <SelectionButton icon={Zap} label="Explain" onClick={() => handleAskAI(`请深度解释这段话: ${selection.text}`)} />
                  <SelectionButton icon={Activity} label="Trend" onClick={() => handleAskAI(`请从该选段中提取关键数据指标并分析趋势: ${selection.text}`)} />
                  <SelectionButton icon={StickyNote} label="Note" onClick={addNote} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Intelligence: Analysis History Stack */}
        <AnimatePresence>
          {rightSidebarVisible && (
            <motion.aside
              initial={{ width: 0 }}
              animate={{ width: rightWidth }}
              exit={{ width: 0 }}
              className="border-l border-claude-border bg-claude-ai flex flex-col shrink-0 overflow-hidden"
            >
              <div className="h-[35px] border-b border-claude-border flex items-center justify-between px-4 shrink-0 bg-claude-sidebar">
                <div className="flex items-center gap-2 font-bold text-[10px] tracking-widest text-claude-text-secondary uppercase">
                  <Terminal className="w-3.5 h-3.5" />
                  ANALYSIS STACK: NODIALOG
                </div>
                <History className="w-3.5 h-3.5 text-claude-text-secondary opacity-40 hover:opacity-100 transition-opacity cursor-pointer" />
              </div>

              {/* Chat View / Analysis History */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {chatHistory.length === 0 && (
                  <div className="h-full flex flex-col gap-6">
                    <div className="p-6 claude-card">
                      <h4 className="text-[11px] font-black text-claude-accent mb-5 uppercase tracking-[0.25em] flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5" /> CORE FOCUS AREAS
                      </h4>
                      <div className="space-y-4">
                        <InsightCard label="Valuation Moat" desc="Analysis of ROE stability vs direct sales growth." />
                        <InsightCard label="Systemic Risk" desc="Raw material cost sensitivity and pricing leverage." />
                        <InsightCard label="Market Sentiment" desc="Direct-to-consumer channel expansion metrics." />
                      </div>
                    </div>
                  </div>
                )}
                {chatHistory.map((msg, idx) => (
                  <ChatBubble 
                    key={`chat-${idx}`} 
                    message={msg} 
                    onSourceClick={(s) => scrollToSource(`source-${s}`)}
                  />
                ))}
                {isTyping && (
                  <div className="flex gap-2 px-3">
                    <div className="w-1.5 h-1.5 bg-claude-accent rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-claude-accent rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-claude-accent rounded-full animate-bounce"></div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Command Input Area */}
              <div className="p-5 bg-claude-sidebar border-t border-claude-border text-claude-text-primary">
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-claude-text-secondary opacity-40 group-focus-within:text-claude-accent group-focus-within:opacity-100 transition-all">
                    <Terminal className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && userInput.trim()) {
                        handleAskAI(userInput);
                        setUserInput('');
                      }
                    }}
                    placeholder="Ask Intelligence Node..."
                    className="w-full pl-11 pr-4 py-2.5 bg-claude-ai border border-claude-border rounded-lg text-[13px] focus:outline-none focus:bg-white focus:border-claude-accent transition-all font-medium placeholder:text-claude-text-secondary placeholder:opacity-40"
                  />
                  {userInput.startsWith('/') && (
                    <div className="absolute bottom-full left-0 right-0 mb-3 bg-[#111] text-white rounded-xl shadow-2xl py-2 z-50 border border-white/10 overflow-hidden backdrop-blur-md">
                      <div className="px-4 py-2 text-[10px] text-white/30 font-bold uppercase tracking-[0.3em] border-b border-white/5 mb-1">Slash Stack Commands</div>
                      <SlashCommandItem label="summary" desc="全文摘要" onClick={() => { setUserInput('/summary'); handleAskAI('请对该全文进行核心摘要总结'); }} />
                      <SlashCommandItem label="risk" desc="风险识别" onClick={() => { setUserInput('/risk'); handleAskAI('请识别该财报中的潜在财务及经营风险'); }} />
                      <SlashCommandItem label="peer" desc="同行对比" onClick={() => { setUserInput('/peer'); handleAskAI('请将该公司与其行业龙头进行多维对比分析'); }} />
                    </div>
                  )}
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>


    </div>
  );
}

// --- Sub-components for Refactored UI ---
function ExplorerFolder({ title, icon: Icon = Folder, children, defaultOpen = false, active = false }: { title: string; icon?: React.ElementType; children?: React.ReactNode; defaultOpen?: boolean; active?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="select-none">
      <div 
        className={`tree-node group ${active ? 'tree-node-active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <ChevronDown className="w-3.5 h-3.5 opacity-30" /> : <ChevronRight className="w-3.5 h-3.5 opacity-30" />}
        <Icon className={`w-4 h-4 ${active ? 'text-claude-accent' : 'text-claude-text-secondary opacity-50'} group-hover:text-claude-accent transition-colors`} />
        <span className="truncate font-bold tracking-widest uppercase text-[10px] text-claude-text-secondary">{title}</span>
        <div className="ml-auto opacity-0 group-hover:opacity-60 flex items-center gap-2">
          <Plus className="w-3 h-3 hover:text-claude-accent" />
          <MoreVertical className="w-3 h-3 hover:text-claude-accent" />
        </div>
      </div>
      {isOpen && (
        <div className="relative ml-2">
          <div className="guide-line"></div>
          <div className="pl-4">{children}</div>
        </div>
      )}
    </div>
  );
}

function ExplorerFile({ title, icon: Icon = FileText, active = false, onClick, status }: { title: string; icon?: React.ElementType; active?: boolean; onClick?: () => void; status?: 'opened' | 'draft' }) {
  return (
    <div 
      className={`tree-node group ${active ? 'tree-node-active' : ''}`}
      onClick={onClick}
    >
      <Icon className={`w-4 h-4 ${active ? 'text-claude-accent' : 'text-claude-text-secondary opacity-40'} group-hover:text-claude-accent transition-colors`} />
      <span className="truncate font-medium">{title}</span>
      {status === 'opened' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-claude-accent shadow-[0_0_8px_rgba(0,122,204,0.3)]"></div>}
    </div>
  );
}

function SelectionButton({ icon: Icon, label, onClick }: { icon: any, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-black/5 rounded-full transition-all text-claude-text-primary border border-transparent hover:border-black/5"
    >
      <Icon className="w-3.5 h-3.5 text-claude-accent" />
      <span className="text-[12px] font-semibold">{label}</span>
    </button>
  );
}

function InsightCard({ label, desc }: { label: string, desc: string }) {
  return (
    <div className="group border-b border-claude-border last:border-none pb-4 pt-1 hover:px-1 transition-all cursor-pointer">
      <div className="text-[12px] font-bold text-claude-text-primary mb-1 group-hover:text-claude-accent transition-colors">{label}</div>
      <div className="text-[11px] text-claude-text-secondary font-medium leading-relaxed group-hover:text-claude-text-primary">{desc}</div>
    </div>
  );
}

function SlashCommandItem({ label, desc, onClick }: { label: string, desc: string, onClick: () => void }) {
  return (
    <div 
      className="px-3 py-2 hover:bg-white/10 cursor-pointer flex items-center justify-between"
      onClick={onClick}
    >
      <span className="text-[12px] font-bold text-white">/{label}</span>
      <span className="text-[10px] text-white/40 tracking-wider font-bold uppercase">{desc}</span>
    </div>
  );
}

function ChatBubble({ message, onSourceClick }: { message: ChatMessage; onSourceClick?: (source: string) => void; key?: React.Key }) {
  const isAssistant = message.role === 'assistant';
  return (
    <div className={`flex gap-3 ${isAssistant ? '' : 'flex-row-reverse'}`}>
      <div className={`max-w-[96%] space-y-2`}>
        <div className={`claude-card p-5 text-[14px] leading-relaxed relative ${
          isAssistant 
            ? 'bg-claude-paper text-claude-text-primary' 
            : 'bg-claude-accent text-white border-transparent'
        }`}>
          {isAssistant ? (
             <div className="prose prose-sm max-w-none prose-p:mb-3 last:prose-p:mb-0">
               {message.content.split('\n').map((para, i) => <p key={i} className="mb-3 last:mb-0">{para}</p>)}
             </div>
          ) : (
            <div className="font-semibold">{message.content}</div>
          )}
           {isAssistant && message.sources && message.sources.length > 0 && (
              <div className="mt-4 pt-4 border-t border-claude-border/50 flex items-center justify-between">
                 <div className="flex flex-wrap gap-1.5">
                   {message.sources.map(s => (
                     <span 
                       key={s}
                       onClick={() => onSourceClick?.(s)}
                       className="text-[10px] font-bold text-claude-accent uppercase tracking-wider bg-claude-accent/5 px-2 py-0.5 rounded cursor-pointer hover:bg-claude-accent/10 transition-colors"
                     >
                       RE: {s}
                     </span>
                   ))}
                 </div>
                 <div className="flex gap-4 text-claude-text-secondary opacity-40">
                    <button className="hover:text-claude-accent transition-colors"><Copy className="w-3.5 h-3.5" /></button>
                 </div>
              </div>
           )}
        </div>
      </div>
    </div>
  );
}

function InlineNote({ note, onUpdate, onDelete }: { note: Note; onUpdate: (text: string) => void; onDelete: () => void; key?: React.Key }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="my-8">
      <div 
        className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all border font-sans ${isExpanded ? 'claude-card bg-claude-accent/5! border-claude-accent/20! text-claude-accent shadow-md' : 'bg-claude-sidebar border-transparent text-claude-text-secondary hover:text-claude-text-primary cursor-pointer'}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <StickyNote className="w-4 h-4" />
        <span className="text-[12px] font-bold tracking-widest uppercase">Analytical Note: "{note.selection.slice(0, 24)}..."</span>
        <div className="ml-auto opacity-40">
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </div>
      </div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="claude-card rounded-t-none! border-t-0 p-8 relative">
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="absolute top-6 right-6 text-claude-text-secondary opacity-20 hover:text-red-500 hover:opacity-100 transition-all font-bold"
              >
                <X className="w-4 h-4" />
              </button>
              <textarea 
                autoFocus
                className="w-full bg-transparent border-none p-0 text-[15px] font-medium font-serif focus:ring-0 text-claude-text-primary resize-none min-h-[120px] leading-relaxed placeholder:text-claude-text-secondary/30"
                placeholder="Log internal financial analysis findings..."
                value={note.text}
                onChange={(e) => onUpdate(e.target.value)}
              />
              <div className="mt-6 text-[10px] text-claude-text-secondary opacity-50 font-bold flex justify-end uppercase tracking-[0.3em] pt-4 border-t border-claude-border/30">
                STAMP: {new Date(note.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
