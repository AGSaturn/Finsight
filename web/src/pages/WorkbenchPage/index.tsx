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
  AlertTriangle,
  Search, // PRD: 搜索图标
  Star // PRD: 资产树图标
} from 'lucide-react';
// 【修改1】修正 Framer Motion 导入路径
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext, closestCenter, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { MOCK_REPORTS } from '../../data';
import { FinancialData, ChatMessage, Note, PortfolioNode } from '../../types';
import ExplorerFolder from './ExplorerFolder';
import ExplorerFile from './ExplorerFile';
import SelectionButton from './SelectionButton';
import InsightCard from './InsightCard';
import SlashCommandItem from './SlashCommandItem';
import ChatBubble from './ChatBubble';
import InlineNote from './InlineNote';





interface VisitHistoryRecord {
  id: string;
  uniqueId: string;
  companyName: string;
  lastAccessedAt: number;
}

// Mock model selection for better context


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
  // PRD: 左侧导航Tab状态
  const [leftNavTab, setLeftNavTab] = useState<'tree' | 'recent'>('tree');
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, nodeId: string } | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    })
  );

  // PRD: 模拟 IndexedDB 数据
  const [portfolioNodes, setPortfolioNodes] = useState<PortfolioNode[]>([
    { id: 'folder-1', type: 'folder', name: '核心持仓', parentId: null, order: 0 },
    { id: 'stock-600519', type: 'stock', name: '贵州茅台', parentId: 'folder-1', order: 0, uniqueId: '600519', newReport: true },
    { id: 'folder-2', type: 'folder', name: '观察列表', parentId: null, order: 1 },
    { id: 'folder-3', type: 'folder', name: '科技股', parentId: 'folder-2', order: 0 },
    { id: 'stock-AAPL', type: 'stock', name: '苹果公司', parentId: 'folder-3', order: 0, uniqueId: 'AAPL' },
    { id: 'stock-MSFT', type: 'stock', name: '微软', parentId: 'folder-3', order: 1, uniqueId: 'MSFT' },
    { id: 'stock-PDD', type: 'stock', name: '拼多多', parentId: 'folder-2', order: 1, uniqueId: 'PDD', newReport: true },
  ]);

  const [visitHistory, setVisitHistory] = useState<VisitHistoryRecord[]>([
    { id: 'hist-1', uniqueId: '600519', companyName: '贵州茅台', lastAccessedAt: Date.now() - 1000 * 60 * 5 },
    { id: 'hist-2', uniqueId: 'AAPL', companyName: '苹果公司', lastAccessedAt: Date.now() - 1000 * 60 * 60 * 2 },
  ]);

  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set(['folder-1', 'folder-2', 'folder-3']));

  // PRD: 将扁平数据转换为树形结构
  const portfolioTree = useMemo(() => {
    const tree: PortfolioNode[] = [];
    const map = new Map<string, PortfolioNode>();
    const roots: PortfolioNode[] = [];

    portfolioNodes.forEach(node => {
      map.set(node.id, { ...node, children: [] });
    });

    portfolioNodes.forEach(node => {
      const parent = node.parentId ? map.get(node.parentId) : null;
      const currentNode = map.get(node.id)!;
      if (parent) {
        parent.children?.push(currentNode);
      } else {
        roots.push(currentNode);
      }
    });
    return roots;
  }, [portfolioNodes]);

  // PRD: 文件夹展开/折叠逻辑
  const toggleFolder = (id: string) => {
    setExpandedKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // PRD: 格式化相对时间
  const formatRelativeTime = (timestamp: number) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diff = now.getTime() - date.getTime();
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `今天 ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  };

  // --- PRD 功能占位符 ---
  // 未来这些函数将与 IndexedDB 和后端 API 交互

  const handleSearch = (query: string) => {
    // TODO: PRD 2.5 - 实现公司搜索
    // 1. 防抖处理
    // 2. 调用后端 API: GET /api/v1/companies/search?q={query}
    // 3. 在UI中显示搜索结果
    console.log('Searching for:', query);
  };

  const handleAddNode = (type: 'folder' | 'stock', parentId: string | null = null) => {
    // TODO: PRD 2.2 & 2.5 - 实现添加文件夹或公司
    // 1. 创建一个新的 PortfolioNode 对象
    // 2. 更新 portfolioNodes 状态
    // 3. 将新节点写入 IndexedDB
    if (type === 'folder') {
      const newNode: PortfolioNode = {
        id: `new-folder-${Date.now()}`,
        type: 'folder',
        name: '新建文件夹',
        parentId,
        order: portfolioNodes.filter(n => n.parentId === parentId).length,
        isNew: true,
      };
      setPortfolioNodes(prev => [...prev, newNode]);
      // 自动展开父文件夹
      if (parentId) {
        setExpandedKeys(prev => new Set(prev).add(parentId));
      }
    }
    console.log(`Adding ${type} to ${parentId || 'root'}`);
  };

  const handleDeleteNode = (id: string) => {
    setPortfolioNodes(prev => {
      const nodesToDelete = new Set<string>([id]);
      let changed = true;
      while (changed) {
        changed = false;
        const sizeBefore = nodesToDelete.size;
        prev.forEach(node => {
          if (node.parentId && nodesToDelete.has(node.parentId)) {
            nodesToDelete.add(node.id);
          }
        });
        if (nodesToDelete.size > sizeBefore) {
          changed = true;
        }
      }
      return prev.filter(node => !nodesToDelete.has(node.id));
    });
  };

  const handleMoveNode = (id: string, newParentId: string | null) => {
    console.log(`handleMoveNode called: Moving node ${id} to parent ${newParentId}`);
    setPortfolioNodes(prev => {
      const nodeToMove = prev.find(n => n.id === id);
      if (!nodeToMove) {
        console.error("Node to move not found!");
        return prev;
      }

      const newNodes = prev.map(n => 
        n.id === id ? { ...n, parentId: newParentId } : n
      );

      // Re-order nodes in the new parent
      const siblings = newNodes.filter(n => n.parentId === newParentId);
      siblings.forEach((sibling, index) => {
        const nodeInNewNodes = newNodes.find(n => n.id === sibling.id);
        if (nodeInNewNodes) {
          nodeInNewNodes.order = index;
        }
      });
      
      console.log("New portfolioNodes state:", newNodes);
      return newNodes;
    });
  };

  const handleDragEnd = (event: any) => {
    console.log("--- Drag End ---", event);
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const activeNode = portfolioNodes.find(n => n.id === active.id);
      const overNode = portfolioNodes.find(n => n.id === over.id);

      console.log("Active Node:", activeNode);
      console.log("Over Node:", overNode);

      if (activeNode && overNode) {
        // If dropping on a folder, move the item inside
        if (overNode.type === 'folder') {
          console.log(`Attempting to move [${active.id}] into folder [${over.id}]`);
          handleMoveNode(active.id, over.id);
        } else {
          // If dropping on a file, move to the same folder and re-order
          console.log(`Attempting to move [${active.id}] into same folder as [${over.id}] (parent: ${overNode.parentId})`);
          handleMoveNode(active.id, overNode.parentId);
        }
      }
    }
    setActiveDragId(null);
  };

  const handleDragStart = (event: any) => {
    console.log("--- Drag Start ---", event);
    setActiveDragId(event.active.id);
  };

  const handleRenameNode = (id: string, newName: string) => {
    setPortfolioNodes(prev => 
      prev.map(n => n.id === id ? { ...n, name: newName, isNew: false } : n)
    );
    setEditingNodeId(null);
  };

  const handleContextMenu = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, nodeId });
  };

  const handleUpdateHistory = (uniqueId: string, companyName: string) => {
    // TODO: PRD 2.3 - 更新访问历史
    // 1. 检查记录是否存在，存在则更新时间，否则创建新记录
    // 2. 确保历史记录不超过20条
    // 3. 更新 visitHistory 状态
    // 4. 写入 IndexedDB
    console.log('Updating history for:', uniqueId);
  };

  // --- End of Placeholders ---



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
    const context = contextOverride || selection?.text;
    setChatHistory(prev => [...prev, { role: 'user', content: input }]);
    setIsTyping(true);
    setSelection(null);

    setTimeout(() => {
      setChatHistory(prev => [...prev, { role: 'assistant', content: "AI 功能当前已禁用。" }]);
      setIsTyping(false);
    }, 500);
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

  // PRD: 递归渲染节点组件
  const RenderNode: React.FC<{ node: PortfolioNode }> = ({ node }) => {
    if (node.type === 'folder') {
      if (node.isNew || editingNodeId === node.id) {
        return (
          <div className="flex items-center p-1.5 pl-3">
            <Folder className="w-4 h-4 mr-2 shrink-0" />
            <input
              type="text"
              defaultValue={node.name}
              autoFocus
              onBlur={(e) => handleRenameNode(node.id, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRenameNode(node.id, (e.target as HTMLInputElement).value);
                }
              }}
              className="bg-claude-ai border border-claude-accent rounded px-1 py-0.5 text-sm w-full"
            />
          </div>
        )
      }
      return (
        <ExplorerFolder
          node={node}
          isOpen={expandedKeys.has(node.id)}
          onToggle={() => toggleFolder(node.id)}
          onAddNode={(e) => { e.stopPropagation(); handleAddNode('folder', node.id); }}
          onMoreClick={(e) => handleContextMenu(e, node.id)}
        >
          {node.children?.sort((a,b) => a.order - b.order).map(child => <RenderNode key={child.id} node={child} />)}
        </ExplorerFolder>
      );
    }

    if (node.type === 'stock') {
      return (
        <ExplorerFile
          node={node}
          active={activeTabId === node.uniqueId}
          onClick={() => openReport(node.uniqueId!)}
          status={openTabs.includes(node.uniqueId!) ? "opened" : undefined}
        />
      );
    }

    return null;
  };

  return (
      <div className="flex flex-1 relative">
        {/* Left Sidebar: Claude Explorer */}
        {contextMenu && (
          <div 
            className="fixed z-50 bg-claude-sidebar border border-claude-border rounded-md shadow-lg p-1 text-sm text-claude-text-primary"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onMouseLeave={() => setContextMenu(null)}
          >
            <div 
              className="px-3 py-1.5 hover:bg-claude-ai rounded cursor-pointer"
              onClick={() => {
                setEditingNodeId(contextMenu.nodeId);
                setContextMenu(null);
              }}
            >
              重命名
            </div>
            <div 
              className="px-3 py-1.5 hover:bg-claude-ai rounded cursor-pointer text-red-500"
              onClick={() => {
                handleDeleteNode(contextMenu.nodeId);
                setContextMenu(null);
              }}
            >
              删除
            </div>
          </div>
        )}
        <AnimatePresence>
          {leftSidebarVisible && (
            <motion.aside 
              initial={{ width: 0 }}
              animate={{ width: leftWidth }}
              exit={{ width: 0 }}
              className="border-r border-claude-border bg-claude-sidebar flex flex-col shrink-0"
            >
              {/* PRD: 顶部搜索框 */}
              <div className="h-[40px] flex items-center px-3 gap-2 border-b border-claude-border shrink-0">
                <Search className="w-4 h-4 text-claude-text-secondary" />
                <input 
                  type="text"
                  placeholder="搜索公司名称/代码"
                  className="bg-transparent text-sm w-full focus:outline-none text-claude-text-primary placeholder:text-claude-text-secondary"
                />
              </div>

              {/* PRD: Tab切换 */}
              <div className="h-[35px] flex items-center justify-between border-b border-claude-border shrink-0 bg-claude-sidebar px-2">
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setLeftNavTab('tree')}
                    className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-semibold transition-colors ${leftNavTab === 'tree' ? 'bg-claude-ai text-claude-text-primary' : 'text-claude-text-secondary hover:bg-claude-ai'}`}>
                    <Star className="w-3.5 h-3.5" />
                    资产树
                  </button>
                  <button 
                    onClick={() => setLeftNavTab('recent')}
                    className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-semibold transition-colors ${leftNavTab === 'recent' ? 'bg-claude-ai text-claude-text-primary' : 'text-claude-text-secondary hover:bg-claude-ai'}`}>
                    <History className="w-3.5 h-3.5" />
                    最近
                  </button>
                </div>
                <div className="flex gap-2">
                   <Plus 
                    onClick={() => handleAddNode('folder')}
                    className="w-3.5 h-3.5 text-claude-text-secondary cursor-pointer hover:text-claude-accent" />
                   <MoreVertical className="w-3.5 h-3.5 text-claude-text-secondary cursor-pointer" />
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto py-2">
                {leftNavTab === 'tree' && (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                    <div className="px-2">
                      {portfolioTree.map(node => <RenderNode key={node.id} node={node} />)}
                    </div>
                    <DragOverlay>
                      {activeDragId ? (
                        (() => {
                          const activeNode = portfolioNodes.find(n => n.id === activeDragId);
                          if (!activeNode) return null;
                          if (activeNode.type === 'folder') {
                            return <div className="bg-claude-sidebar p-1.5 rounded shadow-lg flex items-center"><Folder className="w-4 h-4 mr-2 shrink-0" />{activeNode.name}</div>;
                          }
                          return <div className="bg-claude-sidebar p-1.5 rounded shadow-lg flex items-center"><FileText className="w-4 h-4 mr-2 shrink-0" />{activeNode.name}</div>;
                        })()
                      ) : null}
                    </DragOverlay>
                  </DndContext>
                )}

                {leftNavTab === 'recent' && (
                  <div className="px-2 space-y-1">
                    {visitHistory.length > 0 ? (
                      visitHistory
                        .sort((a, b) => b.lastAccessedAt - a.lastAccessedAt)
                        .map(item => (
                          <div 
                            key={item.id} 
                            className="flex items-center justify-between p-2 rounded hover:bg-claude-ai cursor-pointer"
                            onClick={() => openReport(item.uniqueId)}
                          >
                            <span className="text-sm text-claude-text-primary font-medium">{item.companyName}</span>
                            <span className="text-xs text-claude-text-secondary">{formatRelativeTime(item.lastAccessedAt)}</span>
                          </div>
                        ))
                    ) : (
                      <div className='p-4 text-center text-xs text-claude-text-secondary'>
                        <p>暂无访问记录</p>
                        <p className='opacity-60'>点击公司即可生成历史</p>
                      </div>
                    )}
                  </div>
                )}
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