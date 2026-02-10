import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: React.ReactNode;
  value: React.ReactNode;
  helper?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
};

export function StatCard({
  label,
  value,
  helper,
  icon,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("surface-card", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {label}
            </div>
            <div className="text-3xl font-semibold text-foreground">
              {value}
            </div>
            {helper ? (
              <div className="text-xs text-muted-foreground">{helper}</div>
            ) : null}
          </div>
          {icon ? (
            <div className="rounded-xl bg-muted/60 p-3 text-muted-foreground">
              {icon}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
