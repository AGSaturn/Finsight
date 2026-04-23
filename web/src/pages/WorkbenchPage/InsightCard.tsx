import React from 'react';

function InsightCard({ label, desc, icon: Icon }: { label: string, desc: string, icon?: React.ElementType }) {
  return (
    <div className="group border-b border-claude-border last:border-none pb-4 pt-1 hover:px-1 transition-all cursor-pointer flex items-start gap-3">
      {Icon && <Icon className="w-4 h-4 text-claude-accent mt-1 shrink-0" />}
      <div>
        <div className="text-[12px] font-bold text-claude-text-primary mb-1 group-hover:text-claude-accent transition-colors">{label}</div>
        <div className="text-[11px] text-claude-text-secondary font-medium leading-relaxed group-hover:text-claude-text-primary">{desc}</div>
      </div>
    </div>
  );
}

export default InsightCard;
