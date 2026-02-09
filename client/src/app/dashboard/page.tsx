"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { listProducts } from "@/services/productService";
import type { Product } from "@/types/product";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Package, ShieldCheck, AlertTriangle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isReady } = useAuth();
  const { t } = useTranslation();
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
      } catch (err) {
        setError(t("dashboard.loadFailed"));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

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

  if (!isReady) {
    return <div className="p-6">{t("common.loading")}</div>;
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-[linear-gradient(120deg,var(--surface-1),var(--surface-2))] p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
        <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="relative z-10 space-y-2">
          <Badge className="bg-primary/10 text-primary border border-primary/20">
            {t("dashboard.badge")}
          </Badge>
          <h1 className="text-3xl md:text-4xl font-semibold text-foreground">
            {t("dashboard.title")}
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            {t("dashboard.subtitle")}
          </p>
        </div>
      </section>

      {error ? (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 px-3 py-2 rounded-md">
          {error}
        </div>
      ) : null}

      <section className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {t("dashboard.section.snapshot.title")}
            </p>
            <h2 className="text-lg font-semibold text-foreground">
              {t("dashboard.section.snapshot.subtitle")}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => router.push("/product")}>
              {t("dashboard.action.viewInventory")}
            </Button>
            <Button
              className="bg-primary text-primary-foreground hover:bg-[color:var(--jade-600)]"
              onClick={() => router.push("/product")}
            >
              {t("dashboard.action.manageProducts")}
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 items-start">
          <Card className="border-border/60 shadow-[0_16px_40px_rgba(15,23,42,0.08)] flex h-full flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Package size={16} className="text-emerald-600" />
                {t("dashboard.products")}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold flex-1">
              {loading ? t("common.loadingShort") : stats.products}
              <div className="text-xs text-muted-foreground mt-1">
                {t("dashboard.productsTotal")}
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-[0_16px_40px_rgba(15,23,42,0.08)] flex h-full flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-600" />
                {t("dashboard.certificates")}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold space-y-2 flex-1">
              <div>
                {loading ? t("common.loadingShort") : stats.certificates}
              </div>
              <div className="text-xs text-muted-foreground">
                {t("dashboard.certificatesVerified")} {stats.verified} /{" "}
                {stats.certificates}
              </div>
              <Progress value={stats.verifiedRatio} className="mt-1" />
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-[0_16px_40px_rgba(15,23,42,0.08)] flex h-full flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-600" />
                {t("dashboard.status")}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold space-y-2 flex-1">
              <div>
                {t("dashboard.pending")}: {stats.pending}
              </div>
              <div className="text-xs text-muted-foreground">
                {t("dashboard.unverified")}: {stats.unverified}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_0.9fr] items-start">
        <Card className="border-border/60 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
          <CardHeader className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>{t("dashboard.section.inventory.title")}</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/product")}
              >
                {t("dashboard.action.viewInventory")}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("dashboard.section.inventory.subtitle")}
            </p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("dashboard.table.gemstone")}</TableHead>
                  <TableHead>{t("dashboard.table.jewelry")}</TableHead>
                  <TableHead>{t("dashboard.table.certificate")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={3}>{t("common.loading")}</TableCell>
                  </TableRow>
                ) : products.length ? (
                  products.slice(0, 5).map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        {formatGemstoneType(product.gemstoneType) ||
                          t("common.placeholder")}
                      </TableCell>
                      <TableCell>
                        {formatJewelryType(product.jewelryType) ||
                          t("common.placeholder")}
                      </TableCell>
                      <TableCell>
                        {formatCertificateStatus(product.certificateStatus)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3}>
                      {t("dashboard.noProducts")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
          <CardHeader className="space-y-2">
            <CardTitle>{t("dashboard.section.breakdown.title")}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t("dashboard.section.breakdown.subtitle")}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
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
                <span className="text-muted-foreground">
                  {stats.unverified}
                </span>
              </div>
              <Progress
                value={
                  stats.certificates
                    ? Math.round((stats.unverified / stats.certificates) * 100)
                    : 0
                }
              />
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
