import React from 'react';
import { Copy } from 'lucide-react';
import { ChatMessage } from '../../types';
import Typewriter from './Typewriter';

function ChatBubble({ message, onSourceClick, isStreaming }: { message: ChatMessage; onSourceClick?: (source: string) => void; isStreaming?: boolean; key?: React.Key }) {
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
                {isStreaming ? <Typewriter text={message.content} speed={20} /> : message.content.split('\n').map((para, i) => <p key={i} className="mb-3 last:mb-0">{para}</p>)}
             </div>
          ) : (
            <div className="font-semibold">{message.content}</div>
          )}
           {isAssistant && message.sources && message.sources.length > 0 && !isStreaming && (
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

export default ChatBubble;
