"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { listProducts } from "@/services/productService";
import type { Product } from "@/types/product";
import { usePermission } from "@/hooks/usePermission";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Package, ShieldCheck, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/layout/StatCard";
import { SectionCard } from "@/components/layout/SectionCard";
import { DataTable } from "@/components/layout/DataTable";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isReady } = useAuth();
  const { t } = useTranslation();
  const canManageProducts = usePermission("product", "manage");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const jewelryTypeLabels: Record<string, string> = {
    Bracelet: t("jewelry.bracelet"),
    Beadedbracelet: t("jewelry.beadedBracelet"),
    Pendant: t("jewelry.pendant"),
    Earrings: t("jewelry.earrings"),
    Rings: t("jewelry.rings"),
  };

  const gemstoneTypeLabels: Record<string, string> = {
    Nuo: t("gemstone.nuo"),
    "Nuo transformation": t("gemstone.nuoTransformation"),
    "Nuo ice": t("gemstone.nuoIce"),
    Ice: t("gemstone.ice"),
    "High ice": t("gemstone.highIce"),
    Glass: t("gemstone.glass"),
  };

  const formatGemstoneType = (value?: Product["gemstoneType"]) => {
    if (!value) return "";
    return gemstoneTypeLabels[value] || value;
  };

  const formatJewelryType = (value?: Product["jewelryType"]) => {
    if (!value) return "";
    return jewelryTypeLabels[value] || value;
  };

  const formatCertificateStatus = (value?: Product["certificateStatus"]) => {
    if (!value) return t("certificate.unverified");
    const normalized = value.toLowerCase();
    if (normalized === "verified") return t("certificate.verified");
    if (normalized === "pending") return t("certificate.pending");
    return t("certificate.unverified");
  };

  useEffect(() => {
    if (isReady && !user) {
      router.replace("/login");
    }
  }, [isReady, user, router]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const nextProducts = await listProducts();
        setProducts(nextProducts);
      } catch {
        setError(t("dashboard.loadFailed"));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user, t]);

  const stats = useMemo(() => {
    const normalizeStatus = (status?: string) =>
      status ? status.toLowerCase() : "unverified";
    const verified = products.filter(
      (product) => normalizeStatus(product.certificateStatus) === "verified",
    ).length;
    const pending = products.filter(
      (product) => normalizeStatus(product.certificateStatus) === "pending",
    ).length;
    const unverified = products.length - verified - pending;
    const verifiedRatio = products.length
      ? Math.round((verified / products.length) * 100)
      : 0;
    return {
      products: products.length,
      certificates: products.length,
      verified,
      pending,
      unverified,
      verifiedRatio,
    };
  }, [products]);

  const latestRows = useMemo(
    () =>
      loading
        ? []
        : products
            .slice(0, 5)
            .map((product) => [
              formatGemstoneType(product.gemstoneType) ||
                t("common.placeholder"),
              formatJewelryType(product.jewelryType) || t("common.placeholder"),
              formatCertificateStatus(product.certificateStatus),
            ]),
    [
      loading,
      products,
      t,
      formatGemstoneType,
      formatJewelryType,
      formatCertificateStatus,
    ],
  );

  if (!isReady) {
    return <div className="p-6">{t("common.loading")}</div>;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("dashboard.badge")}
        title={t("dashboard.title")}
        subtitle={t("dashboard.subtitle")}
        actions={
          <>
            <Button variant="outline" onClick={() => router.push("/product")}>
              {t("dashboard.action.viewInventory")}
            </Button>
            {canManageProducts ? (
              <Button onClick={() => router.push("/product")}>
                {t("dashboard.action.manageProducts")}
              </Button>
            ) : null}
          </>
        }
      />

      {error ? (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 px-3 py-2 rounded-md">
          {error}
        </div>
      ) : null}

      <section className="space-y-4">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {t("dashboard.section.snapshot.title")}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 items-start">
          <StatCard
            label={t("dashboard.products")}
            value={loading ? t("common.loadingShort") : stats.products}
            helper={t("dashboard.productsTotal")}
            icon={<Package size={18} className="text-primary" />}
          />
          <StatCard
            label={t("dashboard.certificates")}
            value={loading ? t("common.loadingShort") : stats.certificates}
            helper={`${t("dashboard.certificatesVerified")} ${stats.verified} / ${stats.certificates}`}
            icon={<ShieldCheck size={18} className="text-primary" />}
          />
          <StatCard
            label={t("dashboard.status")}
            value={`${stats.pending}`}
            helper={`${t("dashboard.unverified")}: ${stats.unverified}`}
            icon={<AlertTriangle size={18} className="text-amber-600" />}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_0.9fr] items-start">
        <SectionCard
          title={t("dashboard.section.inventory.title")}
          subtitle={t("dashboard.section.inventory.subtitle")}
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/product")}
            >
              {t("dashboard.action.viewInventory")}
            </Button>
          }
        >
          <DataTable
            headers={[
              t("dashboard.table.gemstone"),
              t("dashboard.table.jewelry"),
              t("dashboard.table.certificate"),
            ]}
            rows={latestRows}
            emptyState={
              loading ? t("common.loading") : t("dashboard.noProducts")
            }
          />
        </SectionCard>
        <SectionCard
          title={t("dashboard.section.breakdown.title")}
          subtitle={t("dashboard.section.breakdown.subtitle")}
          contentClassName="space-y-4"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-foreground">
                {t("certificate.verified")}
              </span>
              <span className="text-muted-foreground">{stats.verified}</span>
            </div>
            <Progress value={stats.verifiedRatio} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-foreground">
                {t("certificate.pending")}
              </span>
              <span className="text-muted-foreground">{stats.pending}</span>
            </div>
            <Progress
              value={
                stats.certificates
                  ? Math.round((stats.pending / stats.certificates) * 100)
                  : 0
              }
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-foreground">
                {t("certificate.unverified")}
              </span>
              <span className="text-muted-foreground">{stats.unverified}</span>
            </div>
            <Progress
              value={
                stats.certificates
                  ? Math.round((stats.unverified / stats.certificates) * 100)
                  : 0
              }
            />
          </div>
        </SectionCard>
      </section>
    </div>
  );
}
