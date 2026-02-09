"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  InfoRowItem,
  SpecificationList,
  CertificateStatusBadge,
  PriceDisplay,
} from "@/components/ProductInfoSection";
import type { Product, CertificateStatus } from "@/types/product";
import * as productService from "@/services/productService";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";
import * as permissionService from "@/services/permissionService";

const normalizeStatus = (status?: CertificateStatus) =>
  status ? status.toLowerCase() : "unverified";

const formatMoney = (value?: string) => {
  if (value === undefined || value === null || value === "") return "0";
  return value;
};

const formatMm = (value?: number) =>
  value === undefined || value === null ? "" : `${value} mm`;

export default function ProductDetailsPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const { user } = useAuth();
  const { t } = useTranslation();
  const pricingPermission = user?.permissions?.["Pricing & billing"];
  const canViewBuyingPrice =
    user?.role === "ADMIN" ||
    user?.role === "SUPER_ADMIN" ||
    pricingPermission === "read" ||
    pricingPermission === "manage" ||
    pricingPermission === "full";
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);

  const hasBuyingPrice =
    product?.buyingPrice !== undefined &&
    product?.buyingPrice !== null &&
    product?.buyingPrice !== "";
  const showBuyingPrice = canViewBuyingPrice || hasBuyingPrice;

  const formatStatusBadge = (
    status?: CertificateStatus,
  ): "verified" | "pending" | "unverified" => {
    const normalized = normalizeStatus(status);
    if (normalized === "verified") return "verified";
    if (normalized === "pending") return "pending";
    return "unverified";
  };

  const formatGemstoneTypeL = (value?: Product["gemstoneType"]) => {
    if (!value) return "";
    const gemstoneTypeLabels: Record<string, string> = {
      Nuo: t("gemstone.nuo"),
      "Nuo transformation": t("gemstone.nuoTransformation"),
      "Nuo ice": t("gemstone.nuoIce"),
      Ice: t("gemstone.ice"),
      "High ice": t("gemstone.highIce"),
      Glass: t("gemstone.glass"),
    };
    return gemstoneTypeLabels[value] || value;
  };

  const formatEarringTypeL = (value?: Product["dimensions"]["earringType"]) => {
    if (!value) return "";
    const earringTypeLabels: Record<string, string> = {
      stud: t("product.earring.stud"),
      drop: t("product.earring.drop"),
      hoop: t("product.earring.hoop"),
      dangle: t("product.earring.dangle"),
    };
    return earringTypeLabels[value] || value;
  };

  const formatJewelryTypeL = (value?: Product["jewelryType"]) => {
    if (!value) return "";
    const jewelryTypeLabels: Record<string, string> = {
      Bracelet: t("product.jewelry.bracelet"),
      Beadedbracelet: t("product.jewelry.beadedBracelet"),
      Pendant: t("product.jewelry.pendant"),
      Earrings: t("product.jewelry.earrings"),
      Rings: t("product.jewelry.rings"),
    };
    return jewelryTypeLabels[value] || value;
  };

  const getDimensionEntriesL = (product: Product) => {
    const dims = product.dimensions || {};
    const entries: { label: string; value: string }[] = [];
    const push = (label: string, value?: number | string) => {
      if (value === undefined || value === null || value === "") return;
      entries.push({ label, value: String(value) });
    };
    const pushMm = (label: string, value?: number) => {
      if (value === undefined || value === null) return;
      entries.push({ label, value: formatMm(value) });
    };

    if (product.jewelryType === "Bracelet") {
      pushMm(t("product.dim.ni"), dims.innerDiameterMm);
      pushMm(t("product.dim.width"), dims.widthMm);
      pushMm(t("product.dim.thickness"), dims.thicknessMm);
      push(
        t("product.label.dimension"),
        dims.shape
          ? dims.shape === "round"
            ? t("product.bangle.shapeRound")
            : t("product.bangle.shapeOval")
          : undefined,
      );
      push(
        t("product.label.jewelry"),
        dims.bangleProfile
          ? dims.bangleProfile === "round"
            ? t("product.bangle.profileRound")
            : t("product.bangle.profileFlat")
          : undefined,
      );
    } else if (product.jewelryType === "Beadedbracelet") {
      pushMm(t("product.dim.beadSize"), dims.beadDiameterMm);
      pushMm(t("product.placeholder.beadMax"), dims.maxBeadDiameterMm);
      pushMm(t("product.placeholder.beadMin"), dims.minBeadDiameterMm);
      push(t("product.dim.beadCount"), dims.beadCount);
      pushMm(t("product.placeholder.beadLength"), dims.lengthMm);
    } else if (product.jewelryType === "Pendant") {
      pushMm(t("product.dim.length"), dims.lengthMm);
      pushMm(t("product.dim.width"), dims.widthMm);
      pushMm(t("product.dim.thickness"), dims.thicknessMm);
    } else if (product.jewelryType === "Rings") {
      push(t("product.placeholder.ringSize"), dims.ringSize ?? dims.ringSizeUS);
      pushMm(t("product.dim.ni"), dims.innerDiameterMm);
      pushMm(t("product.placeholder.ringWidth"), dims.widthMm);
      pushMm(t("product.dim.thickness"), dims.thicknessMm);
    } else if (product.jewelryType === "Earrings") {
      push(t("product.label.jewelry"), formatEarringTypeL(dims.earringType));
      pushMm(t("product.dim.length"), dims.lengthMm);
      pushMm(t("product.dim.width"), dims.widthMm);
      pushMm(t("product.dim.thickness"), dims.thicknessMm);
    }

    return entries;
  };

  const handleRequestBuyingPrice = async () => {
    setRequestMessage("");
    setRequestLoading(true);
    try {
      await permissionService.requestApproval({
        title: t("product.request.title"),
        area: "Pricing & billing",
      });
      setRequestMessage(t("product.request.sent"));
    } catch {
      setRequestMessage(t("product.request.failed"));
    } finally {
      setRequestLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await productService.getProduct(id);
        const normalized: Product = {
          ...data,
          images: data.images?.length
            ? data.images
            : data.image
              ? [data.image]
              : [],
          image: data.images?.[0] || data.image,
        };
        setProduct(normalized);
      } catch {
        setError(t("product.error.load"));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, t]);

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground">{t("common.loading")}</div>
    );
  }

  if (error) {
    return <div className="text-sm text-destructive">{error}</div>;
  }

  if (!product) {
    return (
      <div className="text-sm text-muted-foreground">
        {t("product.error.load")}
      </div>
    );
  }

  const dimensionEntries = getDimensionEntriesL(product);

  const primaryImage = product.images?.[0];
  const secondaryImages = product.images?.slice(1) ?? [];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {t("product.label.gemstone")}
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold text-foreground">
            {formatGemstoneTypeL(product.gemstoneType) ||
              formatJewelryTypeL(product.jewelryType) ||
              t("product.label.gemstone")}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <CertificateStatusBadge
            status={formatStatusBadge(product.certificateStatus)}
            large
          />
          <Button asChild variant="outline" className="whitespace-nowrap">
            <Link href="/product">{t("common.update")}</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-xl border border-border/60 bg-card p-4">
          <div className="flex items-center justify-between gap-2 pb-3">
            <h2 className="text-sm font-semibold text-foreground">
              {t("product.label.image")}
            </h2>
            {primaryImage && (
              <Badge variant="secondary" className="border-border/60">
                {t("product.image.primary")}
              </Badge>
            )}
          </div>
          {primaryImage ? (
            <div className="space-y-4">
              <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-border/60 bg-muted">
                <Image
                  src={primaryImage}
                  alt={t("product.image.altIndex", { index: 1 })}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              {secondaryImages.length > 0 && (
                <div className="grid grid-cols-4 gap-3">
                  {secondaryImages.map((url, index) => (
                    <div
                      key={`${url}-${index + 1}`}
                      className="relative aspect-square overflow-hidden rounded-md border border-border/60 bg-muted"
                    >
                      <Image
                        src={url}
                        alt={t("product.image.altIndex", { index: index + 2 })}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border/70 bg-muted/40 py-16 text-center text-sm text-muted-foreground">
              {t("product.image.none")}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-border/60 bg-card">
          <div className="space-y-6 p-5">
            <div className="space-y-3">
              <h2 className="text-base font-semibold text-foreground">
                {t("product.info.basicInformation")}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {product.description || t("product.description.empty")}
              </p>
              <div className="space-y-1">
                <InfoRowItem
                  label={t("product.label.gemstone")}
                  value={formatGemstoneTypeL(product.gemstoneType)}
                />
                <InfoRowItem
                  label={t("product.label.jewelry")}
                  value={formatJewelryTypeL(product.jewelryType)}
                />
                <InfoRowItem
                  label={t("product.label.color")}
                  value={product.colorType}
                />
              </div>
            </div>

            {dimensionEntries.length > 0 && (
              <div className="space-y-3 border-t border-border/40 pt-5">
                <h2 className="text-base font-semibold text-foreground">
                  {t("product.info.dimensions")}
                </h2>
                <SpecificationList specs={dimensionEntries} />
              </div>
            )}

            <div className="space-y-4 border-t border-border/40 pt-5">
              <h2 className="text-base font-semibold text-foreground">
                {t("product.info.pricing")}
              </h2>
              <div className="grid gap-4">
                <PriceDisplay
                  label={t("product.label.sellingPrice")}
                  value={formatMoney(product.sellingPrice)}
                  size="lg"
                  highlight
                />
                <div className="rounded-lg border border-border/50 bg-muted/40 p-4">
                  <PriceDisplay
                    label={t("product.label.buyingPrice")}
                    value={
                      showBuyingPrice ? formatMoney(product.buyingPrice) : "—"
                    }
                    size="md"
                  />
                  {!showBuyingPrice && (
                    <div className="mt-3 flex flex-col gap-2.5">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={requestLoading}
                        onClick={handleRequestBuyingPrice}
                        className="w-full"
                      >
                        {requestLoading
                          ? t("common.loading")
                          : t("product.action.requestAccess")}
                      </Button>
                      {requestMessage && (
                        <p className="text-xs text-muted-foreground text-center">
                          {requestMessage}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3 border-t border-border/40 pt-5">
              <h2 className="text-base font-semibold text-foreground">
                {t("product.info.certification")}
              </h2>
              <div className="space-y-1">
                <InfoRowItem
                  label={t("product.label.certificateId")}
                  value={product.certificateId}
                />
                <InfoRowItem
                  label={t("product.label.certificateAuthority")}
                  value={product.certificateAuthority}
                />
                {product.certificateLink && (
                  <div className="flex items-center justify-between py-3 border-b border-border/40">
                    <span className="text-sm text-muted-foreground font-medium">
                      {t("product.label.certificateImage")}
                    </span>
                    <a
                      href={product.certificateLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    >
                      {t("common.view")} →
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
