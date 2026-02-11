/**
 * Product Information Display Components
 * Reusable components for displaying product details in a consistent, elegant format
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/contexts/LanguageContext";

interface InfoRow {
  label: string;
  value: string | React.ReactNode;
  variant?: "default" | "highlight" | "muted";
}

interface ProductSectionProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

interface InfoGridProps {
  rows: InfoRow[];
  columns?: 1 | 2 | 3;
  className?: string;
}

interface PriceDisplayProps {
  label: string;
  value: string;
  currency?: string;
  size?: "sm" | "md" | "lg";
  highlight?: boolean;
}

/**
 * Main section wrapper for product information
 */
export function ProductSection({
  title,
  subtitle,
  icon,
  children,
  className,
}: ProductSectionProps) {
  return (
    <Card className={cn("border-border/50 shadow-lg gap-4", className)}>
      <CardHeader className="border-b border-border/40 pb-4">
        <div className="flex items-center gap-3">
          {icon && <div className="text-lg text-muted-foreground">{icon}</div>}
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">{children}</CardContent>
    </Card>
  );
}

/**
 * Elegant info row display component
 */
export function InfoRowItem({ label, value, variant = "default" }: InfoRow) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/40 last:border-0">
      <span className="text-sm text-muted-foreground font-medium">{label}</span>
      <span
        className={cn(
          "text-sm font-semibold",
          variant === "highlight" && "text-emerald-600 dark:text-emerald-400",
          variant === "muted" && "text-muted-foreground",
        )}
      >
        {value || "—"}
      </span>
    </div>
  );
}

/**
 * Display multiple info rows in a grid layout
 */
export function InfoGrid({ rows, columns = 1, className }: InfoGridProps) {
  const gridClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  }[columns];

  return (
    <div className={cn(`grid ${gridClass} gap-6`, className)}>
      {rows.map((row, idx) => (
        <div key={idx} className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {row.label}
          </p>
          <p className="text-lg font-semibold text-foreground">
            {row.value || "—"}
          </p>
        </div>
      ))}
    </div>
  );
}

/**
 * Display prices in an elegant format
 */
export function PriceDisplay({
  label,
  value,
  currency = "VND",
  size = "md",
  highlight = false,
}: PriceDisplayProps) {
  const sizeClass = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  }[size];

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground font-medium">{label}</p>
      <div className="flex items-baseline gap-2">
        <span
          className={cn(
            `font-bold ${sizeClass}`,
            highlight &&
              "bg-linear-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent",
          )}
        >
          {value}
        </span>
        {currency && (
          <span className="text-sm text-muted-foreground font-medium">
            {currency}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Status badge component for certificate status
 */
export interface CertificateStatusBadgeProps {
  status: "verified" | "pending" | "unverified";
}

export function CertificateStatusBadge({
  status,
}: CertificateStatusBadgeProps) {
  const { t } = useTranslation();
  const variants = {
    verified: "bg-emerald-100 text-emerald-700 border-emerald-200",
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    unverified: "bg-slate-100 text-slate-700 border-slate-200",
  };

  const labels = {
    verified: t("certificate.verified"),
    pending: t("certificate.pending"),
    unverified: t("certificate.unverified"),
  };

  return (
    <Badge
      variant="outline"
      className={cn(variants[status], "text-[11px] font-semibold")}
    >
      {labels[status]}
    </Badge>
  );
}

/**
 * Specification list component for displaying dimensions and specs
 */
interface SpecificationListProps {
  specs: Array<{ label: string; value: string | React.ReactNode }>;
  className?: string;
}

export function SpecificationList({
  specs,
  className,
}: SpecificationListProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {specs.map((spec, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between py-2 border-b border-border/40 last:border-0"
        >
          <span className="text-sm text-muted-foreground font-medium">
            {spec.label}
          </span>
          <span className="text-sm font-semibold text-foreground">
            {spec.value || "—"}
          </span>
        </div>
      ))}
    </div>
  );
}
