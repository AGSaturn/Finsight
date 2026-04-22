import React from 'react';
import { FileText } from 'lucide-react';

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

export default ExplorerFile;
