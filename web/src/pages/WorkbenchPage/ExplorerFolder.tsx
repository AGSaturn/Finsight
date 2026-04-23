import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Folder, Plus, MoreVertical } from 'lucide-react';

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

export default ExplorerFolder;
