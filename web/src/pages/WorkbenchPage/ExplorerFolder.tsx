import React, { PropsWithChildren } from 'react';
import { ChevronDown, ChevronRight, Folder, Plus, MoreVertical } from 'lucide-react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { PortfolioNode } from '../../types';

interface ExplorerFolderProps {
  node: PortfolioNode;
  isOpen?: boolean;
  onToggle?: () => void;
  onAddNode?: (e: React.MouseEvent) => void;
  onMoreClick?: (e: React.MouseEvent) => void;
  isEditing?: boolean;
  onRename?: (newName: string) => void;
}

function ExplorerFolder({ node, children, isOpen, onToggle, onAddNode, onMoreClick, isEditing, onRename }: PropsWithChildren<ExplorerFolderProps>) {
  const { attributes, listeners, setNodeRef: setDraggableRef, isDragging } = useDraggable({
    id: node.id,
    disabled: isEditing,
  });
  const { isOver, setNodeRef: setDroppableRef } = useDroppable({
    id: node.id,
    disabled: isEditing,
  });

  const setNodeRef = (el: HTMLDivElement | null) => {
    setDraggableRef(el);
    setDroppableRef(el);
  };

  const handleRename = (newName: string) => {
    if (onRename) {
      onRename(newName);
    }
  };

  return (
    <div className="select-none">
      <div
        ref={setNodeRef}
        {...(isEditing ? {} : listeners)}
        {...(isEditing ? {} : attributes)}
        className={`tree-node group transition-colors ${isOver && !isEditing ? 'bg-blue-500/20' : ''}`}
        style={{ opacity: isDragging ? 0.5 : 1 }}
        onClick={isEditing ? undefined : onToggle}
      >
        <div className="flex items-center flex-grow" onClick={isEditing ? (e) => e.stopPropagation() : undefined}>
          {isOpen ? <ChevronDown className="w-3.5 h-3.5 opacity-30" /> : <ChevronRight className="w-3.5 h-3.5 opacity-30" />}
          <Folder className={`w-4 h-4 text-claude-text-secondary opacity-50 group-hover:text-claude-accent transition-colors`} />
          {isEditing ? (
            <input
              type="text"
              defaultValue={node.name}
              autoFocus
              onBlur={(e) => handleRename(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRename((e.target as HTMLInputElement).value);
                }
                if (e.key === 'Escape') {
                  handleRename(node.name); // Revert changes on escape
                }
              }}
              className="bg-claude-ai border border-claude-accent rounded px-1 py-0.5 text-sm w-full ml-2"
            />
          ) : (
            <span className="truncate font-bold tracking-widest uppercase text-[10px] text-claude-text-secondary ml-2">{node.name}</span>
          )}
        </div>
        {!isEditing && (
          <div className="ml-auto opacity-0 group-hover:opacity-60 flex items-center gap-2">
            <Plus className="w-3 h-3 hover:text-claude-accent" onClick={onAddNode} />
            <MoreVertical className="w-3 h-3 hover:text-claude-accent" onClick={onMoreClick} />
          </div>
        )}
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
