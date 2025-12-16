import React, { createContext, useContext, useState, useCallback } from 'react';

interface InstructionsContextType {
  showInstructions: () => void;
  hideInstructions: () => void;
  isOpen: boolean;
}

const InstructionsContext = createContext<InstructionsContextType | null>(null);

export const InstructionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const showInstructions = useCallback(() => {
    setIsOpen(true);
  }, []);

  const hideInstructions = useCallback(() => {
    setIsOpen(false);
  }, []);

  const value: InstructionsContextType = {
    showInstructions,
    hideInstructions,
    isOpen,
  };

  return <InstructionsContext.Provider value={value}>{children}</InstructionsContext.Provider>;
};

export const useInstructions = (): InstructionsContextType => {
  const context = useContext(InstructionsContext);
  if (!context) {
    throw new Error('useInstructions must be used within an InstructionsProvider');
  }
  return context;
};
