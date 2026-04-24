import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Lock } from 'lucide-react';

interface LoginModalProps {
  onClose: () => void;
  onLogin: (email: string) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose, onLogin }) => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      onLogin(email);
    }
  };

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
              <Lock className="w-5 h-5 text-claude-accent" />
              <h2 className="text-lg font-bold text-claude-text-primary">Access Finsight</h2>
            </div>
            <button onClick={onClose} className="text-claude-text-secondary hover:text-claude-text-primary">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <p className="text-sm text-claude-text-secondary mb-4">
              Enter your email to log in or create an account. This is a mock login for demonstration.
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 bg-claude-ai border border-claude-border rounded-lg text-[13px] focus:outline-none focus:bg-white focus:border-claude-accent transition-all font-medium placeholder:text-claude-text-secondary"
              required
            />
            <button 
              type="submit"
              className="w-full mt-6 px-4 py-2.5 bg-claude-accent text-white rounded-md text-sm font-bold hover:opacity-90 transition-opacity"
            >
              Continue with Email
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginModal;
