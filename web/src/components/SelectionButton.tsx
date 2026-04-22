import React from 'react';

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

export default SelectionButton;
