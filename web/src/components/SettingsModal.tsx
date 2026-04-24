import React from 'react';
import { motion } from 'framer-motion';
import { X, Settings } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
  settings: { fontSize: string; themeIntensity: string; autoAnalyze: boolean };
  onUpdate: (newSettings: Partial<SettingsModalProps['settings']>) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, settings, onUpdate }) => {
  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-claude-sidebar border border-claude-border rounded-lg shadow-2xl w-full max-w-md m-4"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-claude-accent" />
              <h2 className="text-lg font-bold text-claude-text-primary">Settings</h2>
            </div>
            <button onClick={onClose} className="text-claude-text-secondary hover:text-claude-text-primary">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-sm font-bold text-claude-text-secondary">Font Size</label>
              <div className="flex gap-2 mt-2">
                {['small', 'medium', 'large'].map(size => (
                  <button 
                    key={size}
                    onClick={() => onUpdate({ fontSize: size })}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                      settings.fontSize === size 
                        ? 'bg-claude-accent text-white' 
                        : 'bg-claude-ai hover:bg-claude-border'
                    }`}>
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
};

export default SettingsModal;
