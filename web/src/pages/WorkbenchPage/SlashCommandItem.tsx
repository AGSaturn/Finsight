import React from 'react';

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

export default SlashCommandItem;
