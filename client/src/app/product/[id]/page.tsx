"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import {
  ProductSection,
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
    status?: CertificateStatus
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

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Section */}
      <div className="flex items-start justify-between gap-6 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-3 flex-wrap">
            <h1 className="text-4xl font-bold tracking-tight">
              {formatGemstoneTypeL(product.gemstoneType) ||
                formatJewelryTypeL(product.jewelryType) ||
                t("product.label.gemstone")}
            </h1>
            <CertificateStatusBadge
              status={formatStatusBadge(product.certificateStatus)}
              large
            />
          </div>
          <p className="text-base text-muted-foreground max-w-2xl leading-relaxed">
            {product.description || t("product.description.empty")}
          </p>
        </div>
        <Button asChild variant="outline" className="whitespace-nowrap">
          <Link href="/product">{t("common.update")}</Link>
        </Button>
      </div>

      {/* Media Gallery Section */}
      <ProductSection title={t("product.label.image")}>
        {product.images?.length ? (
          product.images.length > 2 ? (
            <Carousel className="w-full">
              <CarouselContent>
                {product.images.map((url, index) => (
                  <CarouselItem key={`${url}-${index}`}>
                    <div className="relative w-full bg-muted rounded-xl overflow-hidden border border-border/50">
                      <div className="relative aspect-square">
                        <Image
                          src={url}
                          alt={t("product.image.altIndex", { index: index + 1 })}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      {index === 0 && (
                        <div className="absolute top-4 right-4">
                          <Badge className="bg-primary/90 text-primary-foreground text-xs font-semibold">
                            {t("product.image.primary")}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-3 bg-background/60 backdrop-blur border-border hover:bg-background/80" />
              <CarouselNext className="right-3 bg-background/60 backdrop-blur border-border hover:bg-background/80" />
            </Carousel>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {product.images.map((url, index) => (
                <div
                  key={`${url}-${index}`}
                  className="relative w-full bg-muted rounded-xl overflow-hidden border border-border/50 group"
                >
                  <div className="relative aspect-square">
                    <Image
                      src={url}
                      alt={t("product.image.altIndex", { index: index + 1 })}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      unoptimized
                    />
                  </div>
                  {index === 0 && (
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-primary/90 text-primary-foreground text-xs font-semibold">
                        {t("product.image.primary")}
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t("product.image.none")}</p>
          </div>
        )}
      </ProductSection>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Basic Info Section */}
        <ProductSection title={t("product.info.basicInformation")}>
          <div className="space-y-2">
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
        </ProductSection>

        {/* Dimensions Section */}
        {dimensionEntries.length > 0 && (
          <ProductSection title={t("product.info.dimensions")}>
            <SpecificationList specs={dimensionEntries} />
          </ProductSection>
        )}
      </div>

      {/* Pricing Section */}
      <ProductSection title={t("product.info.pricing")}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <PriceDisplay
              label={t("product.label.buyingPrice")}
              value={showBuyingPrice ? formatMoney(product.buyingPrice) : "—"}
              size="lg"
            />
            {!showBuyingPrice && (
              <div className="flex flex-col gap-2.5">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={requestLoading}
                  onClick={handleRequestBuyingPrice}
                  className="w-full"
                >
                  {requestLoading ? t("common.loading") : t("product.action.requestAccess")}
                </Button>
                {requestMessage && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    {requestMessage}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <PriceDisplay
              label={t("product.label.sellingPrice")}
              value={formatMoney(product.sellingPrice)}
              size="lg"
              highlight
            />
          </div>
        </div>
      </ProductSection>

      {/* Certification Section */}
      <ProductSection title={t("product.info.certification")}>
        <div className="space-y-2">
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
      </ProductSection>
    </div>
  );
}
