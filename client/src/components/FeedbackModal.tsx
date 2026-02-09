"use client";

import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";
import { useFeedback } from "@/contexts/FeedbackContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

const iconMap = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const toneMap = {
  success: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
  error: "text-red-600 bg-red-500/10 border-red-500/20",
  warning: "text-amber-600 bg-amber-500/10 border-amber-500/20",
  info: "text-sky-600 bg-sky-500/10 border-sky-500/20",
};

export function FeedbackModal() {
  const { feedback, hideFeedback } = useFeedback();
  const { t } = useTranslation();

  const isVisible = Boolean(feedback?.open);
  const variant = feedback?.variant || "info";
  const Icon = iconMap[variant];

  return (
    <div
      aria-live="polite"
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm transition-opacity duration-300",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none",
      )}
      onClick={hideFeedback}
    >
      <div
        className="max-w-md w-[90%] rounded-2xl border border-border/60 bg-[linear-gradient(160deg,var(--surface-1),var(--surface-2))] p-6 shadow-[0_24px_70px_rgba(15,23,42,0.25)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full border",
              toneMap[variant],
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-base font-semibold text-foreground">
              {feedback?.title}
            </p>
            <p className="text-sm text-muted-foreground">{feedback?.message}</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <button
            className="rounded-full border border-border/70 px-4 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            onClick={hideFeedback}
          >
            {t("common.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
