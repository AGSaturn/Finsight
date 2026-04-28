import React from 'react';
import { FileText } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { PortfolioNode } from '../../types';

interface ExplorerFileProps {
  node: PortfolioNode;
  active?: boolean;
  onClick?: () => void;
  status?: 'opened' | 'draft';
}

function ExplorerFile({ node, active = false, onClick, status }: ExplorerFileProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: node.id });

  return (
    <div 
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`tree-node group ${active ? 'tree-node-active' : ''}`}
      onClick={onClick}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <FileText className={`w-4 h-4 ${active ? 'text-claude-accent' : 'text-claude-text-secondary opacity-40'} group-hover:text-claude-accent transition-colors`} />
      <span className="truncate font-medium ml-2">{node.name}</span>
      {node.newReport && <div className="ml-2 w-2 h-2 rounded-full bg-blue-500"></div>}
      {status === 'opened' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-claude-accent shadow-[0_0_8px_rgba(0,122,204,0.3)]"></div>}
    </div>
  );
}

export default ExplorerFile;
