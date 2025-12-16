import React, { createContext, useContext, useState, useCallback } from 'react';

interface AboutContextType {
  showAbout: () => void;
  hideAbout: () => void;
  isOpen: boolean;
}

const AboutContext = createContext<AboutContextType | null>(null);

export const AboutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const showAbout = useCallback(() => {
    setIsOpen(true);
  }, []);

  const hideAbout = useCallback(() => {
    setIsOpen(false);
  }, []);

  const value: AboutContextType = {
    showAbout,
    hideAbout,
    isOpen,
  };

  return <AboutContext.Provider value={value}>{children}</AboutContext.Provider>;
};

export const useAbout = (): AboutContextType => {
  const context = useContext(AboutContext);
  if (!context) {
    throw new Error('useAbout must be used within an AboutProvider');
  }
  return context;
};
