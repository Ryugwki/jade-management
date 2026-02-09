"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/contexts/LanguageContext";

type StatusBadgeProps = {
  isActive?: boolean;
  className?: string;
};

export function StatusBadge({ isActive = true, className }: StatusBadgeProps) {
  const { t } = useTranslation();
  const active = isActive !== false;

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[11px] font-semibold",
        active
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
          : "border-slate-400/40 bg-slate-500/10 text-slate-600",
        className,
      )}
    >
      {active ? t("status.active") : t("status.inactive")}
    </Badge>
  );
}
