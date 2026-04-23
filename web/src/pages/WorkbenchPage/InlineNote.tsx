import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StickyNote, ChevronDown, ChevronRight, X } from 'lucide-react';
import { Note } from '../../types';

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

export default InlineNote;
