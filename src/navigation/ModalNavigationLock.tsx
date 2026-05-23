import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

type ModalNavigationLockContextValue = {
  isTabNavigationLocked: boolean;
  setTabNavigationLocked: (locked: boolean) => void;
};

const ModalNavigationLockContext = createContext<ModalNavigationLockContextValue | undefined>(undefined);

export function ModalNavigationLockProvider({ children }: { children: ReactNode }) {
  const [isTabNavigationLocked, setTabNavigationLocked] = useState(false);
  const value = useMemo(
    () => ({ isTabNavigationLocked, setTabNavigationLocked }),
    [isTabNavigationLocked]
  );

  return (
    <ModalNavigationLockContext.Provider value={value}>
      {children}
    </ModalNavigationLockContext.Provider>
  );
}

export function useModalNavigationLock() {
  const context = useContext(ModalNavigationLockContext);

  if (!context) {
    throw new Error('useModalNavigationLock must be used within ModalNavigationLockProvider');
  }

  return context;
}
