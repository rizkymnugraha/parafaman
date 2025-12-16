import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'parafaman-welcome-dismissed';

interface StoredData {
  dismissedAt: number;
}

const isExpired = (timestamp: number): boolean => {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  return now - timestamp > oneDay;
};

export const useWelcomeModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      // First time user, show modal
      setIsOpen(true);
      return;
    }

    try {
      const data: StoredData = JSON.parse(stored);
      if (isExpired(data.dismissedAt)) {
        // Expired, show modal again
        setIsOpen(true);
      }
    } catch {
      // Invalid data, show modal
      setIsOpen(true);
    }
  }, []);

  const closeModal = useCallback(() => {
    const data: StoredData = {
      dismissedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setIsOpen(false);
  }, []);

  const openModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  return {
    isOpen,
    openModal,
    closeModal,
  };
};
