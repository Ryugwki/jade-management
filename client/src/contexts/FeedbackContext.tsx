"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "@/contexts/LanguageContext";

export type FeedbackVariant = "success" | "error" | "warning" | "info";

type FeedbackPayload = {
  title?: string;
  message: string;
  variant?: FeedbackVariant;
  durationMs?: number;
};

type FeedbackState = {
  open: boolean;
  title: string;
  message: string;
  variant: FeedbackVariant;
};

type FeedbackContextValue = {
  feedback: FeedbackState | null;
  showFeedback: (payload: FeedbackPayload) => void;
  hideFeedback: () => void;
};

const FeedbackContext = createContext<FeedbackContextValue | undefined>(
  undefined,
);

const DEFAULT_DURATION_MS = 1200;

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  const defaultTitles = useMemo(
    () => ({
      success: t("feedback.title.success"),
      error: t("feedback.title.error"),
      warning: t("feedback.title.warning"),
      info: t("feedback.title.info"),
    }),
    [t],
  );

  const clearTimer = () => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const hideFeedback = useCallback(() => {
    clearTimer();
    setFeedback((prev) => (prev ? { ...prev, open: false } : null));
  }, []);

  const showFeedback = useCallback(
    (payload: FeedbackPayload) => {
      clearTimer();
      const variant: FeedbackVariant = payload.variant || "info";
      setFeedback({
        open: true,
        title: payload.title || defaultTitles[variant],
        message: payload.message,
        variant,
      });
      const duration = payload.durationMs ?? DEFAULT_DURATION_MS;
      hideTimerRef.current = window.setTimeout(() => {
        setFeedback((prev) => (prev ? { ...prev, open: false } : null));
        hideTimerRef.current = null;
      }, duration);
    },
    [defaultTitles],
  );

  useEffect(() => clearTimer, []);

  const value: FeedbackContextValue = {
    feedback,
    showFeedback,
    hideFeedback,
  };

  return (
    <FeedbackContext.Provider value={value}>
      {children}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) {
    throw new Error("useFeedback must be used within FeedbackProvider");
  }
  return ctx;
}
