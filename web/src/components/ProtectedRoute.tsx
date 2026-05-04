import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoginModal from './LoginModal';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="flex-1 flex items-center justify-center bg-claude-paper">
        <div className="text-center">
          <p className="text-claude-text-secondary text-sm mb-4">
            Sign in required to access the workbench
          </p>
          <button
            onClick={() => setShowLogin(true)}
            className="px-6 py-2.5 bg-claude-accent text-white rounded-md text-sm font-bold hover:opacity-90 transition-opacity"
          >
            Sign In
          </button>
        </div>
      </div>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  );
};

export default ProtectedRoute;
