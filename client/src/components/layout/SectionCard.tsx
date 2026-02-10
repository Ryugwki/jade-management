import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type SectionCardProps = {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
};

export function SectionCard({
  title,
  subtitle,
  action,
  className,
  contentClassName,
  children,
}: SectionCardProps) {
  return (
    <Card className={cn("surface-card", className)}>
      {title || subtitle || action ? (
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            {title ? (
              <CardTitle className="text-base">{title}</CardTitle>
            ) : null}
            {subtitle ? <CardDescription>{subtitle}</CardDescription> : null}
          </div>
          {action ? <div>{action}</div> : null}
        </CardHeader>
      ) : null}
      <CardContent className={cn("space-y-4", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
