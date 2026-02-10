import React from "react";
import { cn } from "@/lib/utils";

type FilterBarProps = {
  filters: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

export function FilterBar({ filters, actions, className }: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/70 p-4",
        "lg:flex-row lg:items-center lg:justify-between",
        className,
      )}
    >
      <div className="flex flex-1 flex-wrap items-center gap-2">{filters}</div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
