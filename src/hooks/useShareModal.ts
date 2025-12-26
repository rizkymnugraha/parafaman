import { useState, useCallback } from 'react';

const STORAGE_KEY = 'parafaman-share-dismissed';

interface StoredData {
  dismissedAt: number;
}

const isExpired = (timestamp: number): boolean => {
  const now = Date.now();
  const oneWeek = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  return now - timestamp > oneWeek;
};

export const useShareModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Check if the modal should be shown (first save or expired)
  const shouldShowOnSave = useCallback((): boolean => {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      // First time user saves, show modal
      return true;
    }

    try {
      const data: StoredData = JSON.parse(stored);
      if (isExpired(data.dismissedAt)) {
        // Expired, show modal again
        return true;
      }
    } catch {
      // Invalid data, show modal
      return true;
    }

    return false;
  }, []);

  // Call this after a successful save
  const triggerAfterSave = useCallback(() => {
    if (shouldShowOnSave()) {
      // Small delay to let the save complete visually
      setTimeout(() => {
        setIsOpen(true);
      }, 500);
    }
  }, [shouldShowOnSave]);

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
    triggerAfterSave,
  };
};
