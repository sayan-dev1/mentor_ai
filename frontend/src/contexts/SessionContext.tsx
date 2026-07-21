import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getSessionId, resetSessionId, checkBackendHealth } from '../api/client';
import type { BackendHealth } from '../types';

interface SessionContextType {
  sessionId: string;
  backendHealth: BackendHealth | null;
  isHealthChecking: boolean;
  refreshHealth: () => Promise<void>;
  resetSession: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessionId, setSessionId] = useState<string>(getSessionId());
  const [backendHealth, setBackendHealth] = useState<BackendHealth | null>(null);
  const [isHealthChecking, setIsHealthChecking] = useState<boolean>(true);

  const refreshHealth = useCallback(async () => {
    setIsHealthChecking(true);
    try {
      const health = await checkBackendHealth();
      setBackendHealth(health);
    } catch {
      setBackendHealth({ status: 'offline', service: 'mentorai-backend' });
    } finally {
      setIsHealthChecking(false);
    }
  }, []);

  useEffect(() => {
    refreshHealth();
    const interval = setInterval(refreshHealth, 30000);
    return () => clearInterval(interval);
  }, [refreshHealth]);

  const resetSession = () => {
    const newId = resetSessionId();
    setSessionId(newId);
  };

  return (
    <SessionContext.Provider
      value={{
        sessionId,
        backendHealth,
        isHealthChecking,
        refreshHealth,
        resetSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used within a SessionProvider');
  return context;
};
