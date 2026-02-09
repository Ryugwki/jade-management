"use client";

import { useLoading } from "@/contexts/LoadingContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export function GlobalLoadingOverlay() {
  const { isVisible } = useLoading();
  const { t } = useTranslation();

  return (
    <div
      aria-live="polite"
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm transition-opacity duration-300",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none",
      )}
    >
      <div className="rounded-2xl border border-border/60 bg-card px-8 py-6 shadow-lg">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          </div>
          <div className="text-sm font-medium text-foreground">
            {t("common.loading")}
          </div>
        </div>
      </div>
    </div>
  );
}
