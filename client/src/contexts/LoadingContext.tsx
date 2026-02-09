"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const MIN_VISIBLE_MS = 500;

type LoadingContextValue = {
  isVisible: boolean;
  isActive: boolean;
  startLoading: (source?: string) => void;
  stopLoading: (source?: string) => void;
  withLoading: <T>(promise: Promise<T>) => Promise<T>;
};

const LoadingContext = createContext<LoadingContextValue | undefined>(
  undefined,
);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [activeCount, setActiveCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const showStartedAtRef = useRef<number | null>(null);
  const hideTimeoutRef = useRef<number | null>(null);

  const clearHideTimeout = () => {
    if (hideTimeoutRef.current !== null) {
      window.clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  const startLoading = useCallback(() => {
    setActiveCount((prev) => prev + 1);
  }, []);

  const stopLoading = useCallback(() => {
    setActiveCount((prev) => Math.max(0, prev - 1));
  }, []);

  const withLoading = useCallback(
    async <T,>(promise: Promise<T>) => {
      startLoading();
      try {
        return await promise;
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading],
  );

  useEffect(() => {
    if (activeCount > 0) {
      clearHideTimeout();
      if (!isVisible) {
        setIsVisible(true);
        showStartedAtRef.current = Date.now();
      }
      return;
    }

    if (!isVisible) return;

    const startedAt = showStartedAtRef.current ?? Date.now();
    const elapsed = Date.now() - startedAt;
    const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);

    clearHideTimeout();
    hideTimeoutRef.current = window.setTimeout(() => {
      setIsVisible(false);
      showStartedAtRef.current = null;
      hideTimeoutRef.current = null;
    }, remaining);
  }, [activeCount, isVisible]);

  useEffect(() => clearHideTimeout, []);

  const value: LoadingContextValue = {
    isVisible,
    isActive: activeCount > 0,
    startLoading,
    stopLoading,
    withLoading,
  };

  return (
    <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>
  );
}

export function useLoading() {
  const ctx = useContext(LoadingContext);
  if (!ctx) {
    throw new Error("useLoading must be used within LoadingProvider");
  }
  return ctx;
}
