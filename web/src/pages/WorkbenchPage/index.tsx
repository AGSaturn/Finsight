import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, 
  X, 
  FileText, 
  StickyNote, 
  Folder, 
  MoreVertical,
  Zap,
  Layout,
  Terminal,
  Activity,
  Coins,
  History,
  Info,
  User,
  Send,
  Target,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
// 【修改1】修正 Framer Motion 导入路径
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI } from "@google/genai";
import { MOCK_REPORTS } from '../../data';
import { FinancialData, ChatMessage, Note } from '../../types';
import ExplorerFolder from './ExplorerFolder';
import ExplorerFile from './ExplorerFile';
import SelectionButton from './SelectionButton';
import InsightCard from './InsightCard';
import SlashCommandItem from './SlashCommandItem';
import ChatBubble from './ChatBubble';
import InlineNote from './InlineNote';

// Mock model selection for better context
const MODEL_NAME = "gemini-3-flash-preview";

export default function WorkbenchPage() {
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
  const [userSettings, setUserSettings] = useState({
    fontSize: 'medium',
    themeIntensity: 'warm',
    autoAnalyze: true
  });

  // 【修改2】安全初始化 Google GenAI
  const ai = useMemo(() => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not set in environment variables.");
      // 返回一个 mock 对象防止崩溃，或者你可以抛出错误
      return {} as GoogleGenAI;
    }
    return new GoogleGenAI({ apiKey });
  }, []);

  const mainRef = useRef<HTMLDivElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto scroll chat
  // useEffect(() => {
  //   chatBottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  // }, [chatHistory]);

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
    // 【修改3】增加 API Key 存在性检查
    if (!process.env.GEMINI_API_KEY) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: "Configuration Error: API Key missing." }]);
      return;
    }

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
      <div className="flex flex-1 relative">
        {/* Left Sidebar: Claude Explorer */}
        <AnimatePresence>
          {leftSidebarVisible && (
            <motion.aside 
              initial={{ width: 0 }}
              animate={{ width: leftWidth }}
              exit={{ width: 0 }}
              className="border-r border-claude-border bg-claude-ai flex flex-col shrink-0"
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
                  <ExplorerFolder title="CONSUMER SECTOR" icon={Folder} defaultOpen>
                  {MOCK_REPORTS.map(report => (
                    <ExplorerFolder 
                      key={report.ticker}
                      title={`${report.company} (${report.ticker})`} 
                      icon={report.ticker === '600519' ? Activity : Layout} 
                      active={activeTabId === report.ticker}
                      defaultOpen={activeTabId === report.ticker}
                    >
                      <ExplorerFolder title="基本信息" icon={Info}>
                        <ExplorerFile title="AI 简要分析" icon={Zap} />
                      </ExplorerFolder>
                      <ExplorerFolder title="财报" icon={FileText} defaultOpen>
                        <ExplorerFile 
                          title={report.period}
                          active={activeTabId === report.ticker} 
                          onClick={() => openReport(report.ticker)}
                          status={openTabs.includes(report.ticker) ? "opened" : undefined}
                        />
                      </ExplorerFolder>
                      <ExplorerFolder title="笔记" icon={StickyNote}>
                        <ExplorerFile title={report.ticker === '600519' ? "核心壁垒分析" : "Competitor Analysis"} icon={StickyNote} />
                      </ExplorerFolder>
                    </ExplorerFolder>
                  ))}
                </ExplorerFolder>
                </ExplorerFolder>

                <ExplorerFolder title="对话历史" icon={History}>
                  {chatHistory.map((chat, index) => (
                    <ExplorerFile
                      key={index}
                      title={chat.content.substring(0, 30) + "..."}
                      icon={chat.role === 'user' ? User : Terminal}
                    />
                  ))}
                </ExplorerFolder>


              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Workbench: Tabs and Reader */}
        <main className="workbench-container relative min-h-0" ref={mainRef}>
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
              className="border-l border-claude-border bg-claude-ai flex flex-col shrink-0"
            >
              <div className="h-[35px] border-b border-claude-border flex items-center justify-between px-4 shrink-0 bg-claude-sidebar">
                <div className="flex items-center gap-2 font-bold text-[10px] tracking-widest text-claude-text-secondary uppercase">
                  <Terminal className="w-3.5 h-3.5" />
                  ANALYSIS STACK: NODIALOG
                </div>
                <div className="flex items-center gap-2">
                  <Plus 
                    onClick={() => setChatHistory([])} 
                    className="w-4 h-4 text-claude-text-secondary opacity-40 hover:opacity-100 transition-opacity cursor-pointer"
                  />
                  <History className="w-3.5 h-3.5 text-claude-text-secondary opacity-40 hover:opacity-100 transition-opacity cursor-pointer" />
                </div>
              </div>

              {/* Chat View / Analysis History */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6 min-h-0">
                {chatHistory.length === 0 && (
                  <div className="h-full flex flex-col gap-6">
                    <div className="p-6 claude-card">
                      <h4 className="text-[11px] font-black text-claude-accent mb-5 uppercase tracking-[0.25em] flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5" /> CORE FOCUS AREAS
                      </h4>
                      <div className="space-y-4">
                        <InsightCard icon={Target} label="Valuation Moat" desc="Analysis of ROE stability vs direct sales growth." />
                        <InsightCard icon={AlertTriangle} label="Systemic Risk" desc="Raw material cost sensitivity and pricing leverage." />
                        <InsightCard icon={TrendingUp} label="Market Sentiment" desc="Direct-to-consumer channel expansion metrics." />
                      </div>
                    </div>
                  </div>
                )}
                {chatHistory.map((msg, idx) => (
                  <ChatBubble 
                    key={`chat-${idx}`} 
                    message={msg} 
                    onSourceClick={(s) => scrollToSource(`source-${s}`)}
                    isStreaming={isTyping && idx === chatHistory.length - 1}
                  />
                ))}
                <div ref={chatBottomRef} />
              </div>

              {/* Command Input Area */}
              <div className="p-5 bg-claude-sidebar border-t border-claude-border text-claude-text-primary shrink-0">
                <div className="relative">
                  <textarea
                    rows={3}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAskAI(userInput);
                        setUserInput('');
                      }
                    }}
                    placeholder="Ask Intelligence Node... (Shift+Enter for new line)"
                    className="w-full pl-4 pr-12 py-3 bg-claude-ai border border-claude-border rounded-lg text-[13px] focus:outline-none focus:bg-white focus:border-claude-accent transition-all font-medium placeholder:text-claude-text-secondary placeholder:opacity-40 resize-none"
                  />
                  <button 
                    onClick={() => {
                      handleAskAI(userInput);
                      setUserInput('');
                    }}
                    className="absolute bottom-3 right-3 p-2 bg-claude-accent text-white rounded-md hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
                    disabled={!userInput.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
  );
}