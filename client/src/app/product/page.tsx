"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { ActionMenu } from "@/components/ActionMenu";
import { PageHeader } from "@/components/layout/PageHeader";
import { FilterBar } from "@/components/layout/FilterBar";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Grid3X3, List, Edit2, Trash2, Plus, Eye } from "lucide-react";
import Link from "next/link";
import { CertificateStatus, Product } from "@/types/product";
import { usePermission } from "@/hooks/usePermission";
import { useTranslation } from "@/contexts/LanguageContext";
import { useLoading } from "@/contexts/LoadingContext";
import { useFeedback } from "@/contexts/FeedbackContext";
import * as productService from "@/services/productService";
import { uploadImageBase64 } from "@/services/uploadService";
import * as permissionService from "@/services/permissionService";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ProductPage() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const { startLoading, stopLoading } = useLoading();
  const { showFeedback } = useFeedback();
  const canViewBuyingPrice = usePermission("pricing", "read");
  const canManageProducts = usePermission("product", "manage");
  type ProductWithPrice = Product & {
    priceRaw?: string;
    priceDisplay?: string;
    priceMin?: number;
    priceMax?: number;
  };

  const [allProducts, setAllProducts] = useState<ProductWithPrice[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJewelryType, setSelectedJewelryType] = useState("");
  const [selectedGemstoneType, setSelectedGemstoneType] = useState("");
  const [selectedPriceRange, setSelectedPriceRange] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<ProductWithPrice | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [priceRequestMessage, setPriceRequestMessage] = useState("");
  const [priceRequestLoading, setPriceRequestLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFilesLabel, setSelectedFilesLabel] = useState(() =>
    t("product.noFile"),
  );
  const [productStatusOpen, setProductStatusOpen] = useState(false);
  const [productStatusLoading, setProductStatusLoading] = useState(false);
  const [productStatusTarget, setProductStatusTarget] =
    useState<ProductWithPrice | null>(null);
  const jewelryFilterLabel = language === "vi" ? "Kiểu" : "Type";

  const jewelryTypeOptions = useMemo(
    () => [
      { value: "Bracelet", label: t("product.jewelry.bracelet") },
      {
        value: "Beadedbracelet",
        label: t("product.jewelry.beadedBracelet"),
      },
      { value: "Pendant", label: t("product.jewelry.pendant") },
      { value: "Earrings", label: t("product.jewelry.earrings") },
      { value: "Rings", label: t("product.jewelry.rings") },
    ],
    [t],
  );

  const jewelryTypeLabels = useMemo<Record<string, string>>(
    () => ({
      Bracelet: t("jewelry.bracelet"),
      Beadedbracelet: t("jewelry.beadedBracelet"),
      Pendant: t("jewelry.pendant"),
      Earrings: t("jewelry.earrings"),
      Rings: t("jewelry.rings"),
    }),
    [t],
  );

  const gemstoneTypeOptions = useMemo(
    () => [
      { value: "Nuo", label: t("gemstone.nuo") },
      { value: "Nuo transformation", label: t("gemstone.nuoTransformation") },
      { value: "Nuo ice", label: t("gemstone.nuoIce") },
      { value: "Ice", label: t("gemstone.ice") },
      { value: "High ice", label: t("gemstone.highIce") },
      { value: "Glass", label: t("gemstone.glass") },
    ],
    [t],
  );

  const earringTypeOptions = [
    { value: "stud", label: t("product.earring.stud") },
    { value: "drop", label: t("product.earring.drop") },
    { value: "hoop", label: t("product.earring.hoop") },
    { value: "dangle", label: t("product.earring.dangle") },
  ];

  const bangleProfileOptions = [
    { value: "round", label: t("product.bangle.profileRound") },
    { value: "flat", label: t("product.bangle.profileFlat") },
  ];

  const bangleShapeOptions = [
    { value: "round", label: t("product.bangle.shapeRound") },
    { value: "oval", label: t("product.bangle.shapeOval") },
  ];

  const priceRangeOptions = [
    { value: "0-50", label: t("product.price.lt50") },
    { value: "50-100", label: t("product.price.50to100") },
    { value: "100-200", label: t("product.price.100to200") },
    { value: "200-500", label: t("product.price.200to500") },
  ];

  const gemstoneTypeLabels = useMemo(
    () =>
      gemstoneTypeOptions.reduce<Record<string, string>>((acc, item) => {
        acc[item.value] = item.label;
        return acc;
      }, {}),
    [gemstoneTypeOptions],
  );

  const formatGemstoneType = useCallback(
    (value?: Product["gemstoneType"]) => {
      if (!value) return "";
      return gemstoneTypeLabels[value] || value;
    },
    [gemstoneTypeLabels],
  );

  const formatJewelryType = useCallback(
    (value?: Product["jewelryType"]) => {
      if (!value) return "";
      return jewelryTypeLabels[value] || value;
    },
    [jewelryTypeLabels],
  );

  const earringTypeLabels = earringTypeOptions.reduce<Record<string, string>>(
    (acc, item) => {
      acc[item.value] = item.label;
      return acc;
    },
    {},
  );

  const formatEarringType = (value?: Product["dimensions"]["earringType"]) => {
    if (!value) return "";
    return earringTypeLabels[value] || value;
  };

  const formatMm = (value?: number) =>
    value === undefined || value === null ? "" : `${value} mm`;

  const formatDimensionSummary = (product: Product) => {
    const placeholder = t("common.placeholder");
    const dims = product.dimensions || {};
    if (product.jewelryType === "Bracelet") {
      const ni = dims.innerDiameterMm
        ? `${t("product.dim.ni")} ${formatMm(dims.innerDiameterMm)}`
        : "";
      const width = dims.widthMm
        ? `${t("product.dim.width")} ${formatMm(dims.widthMm)}`
        : "";
      const thickness = dims.thicknessMm
        ? `${t("product.dim.thickness")} ${formatMm(dims.thicknessMm)}`
        : "";
      const profile = dims.bangleProfile
        ? dims.bangleProfile === "round"
          ? t("product.bangle.profileRound")
          : t("product.bangle.profileFlat")
        : "";
      const shape = dims.shape
        ? dims.shape === "round"
          ? t("product.bangle.shapeRound")
          : t("product.bangle.shapeOval")
        : "";
      return (
        [ni, width, thickness, profile, shape].filter(Boolean).join(" · ") ||
        placeholder
      );
    }
    if (product.jewelryType === "Beadedbracelet") {
      if (dims.beadDiameterMm) {
        return `${t("product.dim.beadSize")} ${formatMm(dims.beadDiameterMm)}`;
      }
      if (dims.minBeadDiameterMm || dims.maxBeadDiameterMm) {
        const min = dims.minBeadDiameterMm
          ? formatMm(dims.minBeadDiameterMm)
          : placeholder;
        const max = dims.maxBeadDiameterMm
          ? formatMm(dims.maxBeadDiameterMm)
          : placeholder;
        return `${t("product.dim.beadRange")} ${min}-${max}`;
      }
      return dims.beadCount
        ? `${t("product.dim.beadCount")} ${dims.beadCount}`
        : placeholder;
    }
    if (product.jewelryType === "Pendant") {
      return dims.lengthMm
        ? `${t("product.dim.length")} ${formatMm(dims.lengthMm)}`
        : placeholder;
    }
    if (product.jewelryType === "Rings") {
      if (dims.ringSize) return `${t("product.dim.size")} ${dims.ringSize}`;
      if (dims.ringSizeUS) return `${t("product.dim.size")} ${dims.ringSizeUS}`;
      return dims.innerDiameterMm
        ? `${t("product.dim.ni")} ${formatMm(dims.innerDiameterMm)}`
        : placeholder;
    }
    if (product.jewelryType === "Earrings") {
      return formatEarringType(dims.earringType) || placeholder;
    }
    return placeholder;
  };

  const fileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve(typeof reader.result === "string" ? reader.result : "");
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const validateProduct = (product: ProductWithPrice | null) => {
    if (!product) return t("product.error.missing");
    return "";
  };

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await productService.listProducts();
        setAllProducts(data.map(normalizeProductForUi));
      } catch {
        setError(t("product.error.load"));
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (fileInputRef.current?.files?.length) return;
    setSelectedFilesLabel(t("product.noFile"));
  }, [language, t]);

  const parsePriceRange = useCallback((value?: string) => {
    if (!value) return null;
    const match = value
      .trim()
      .toLowerCase()
      .match(/^(\d+)x(?:tr)?$/);
    if (!match) return null;
    const base = Number(match[1]);
    if (Number.isNaN(base)) return null;
    return {
      priceMin: base * 10 + 1,
      priceMax: base * 10 + 9,
    };
  }, []);

  const formatPriceDisplay = useCallback(
    (value?: string) => {
      if (!value) return "—";
      const match = value
        .trim()
        .toLowerCase()
        .match(/^(\d+)x(?:tr)?$/);
      if (!match) return value;
      return `${match[1]}x ${t("product.price.unit")}`;
    },
    [t],
  );

  const formatPriceInput = useCallback((value?: string) => {
    if (!value) return "";
    const match = value
      .trim()
      .toLowerCase()
      .match(/^(\d+)x(?:tr)?$/);
    if (match) return `${match[1]}x`;
    return value;
  }, []);

  const normalizePriceStorage = useCallback((value?: string) => {
    if (!value) return "";
    const match = value
      .trim()
      .toLowerCase()
      .match(/^(\d+)x(?:tr)?$/);
    if (!match) return value;
    return `${match[1]}xtr`;
  }, []);

  const isInSelectedPriceRange = useCallback(
    (product: ProductWithPrice) => {
      if (!selectedPriceRange) return true;
      const [min, max] = selectedPriceRange.split("-").map(Number);
      if (Number.isNaN(min) || Number.isNaN(max)) return true;
      if (product.priceMin === undefined || product.priceMax === undefined) {
        return false;
      }
      return product.priceMax >= min && product.priceMin <= max;
    },
    [selectedPriceRange],
  );

  const filteredProducts = useMemo(
    () =>
      allProducts.filter((product) => {
        if (
          selectedJewelryType &&
          product.jewelryType !== selectedJewelryType
        ) {
          return false;
        }
        if (
          selectedGemstoneType &&
          product.gemstoneType !== selectedGemstoneType
        ) {
          return false;
        }
        if (!isInSelectedPriceRange(product)) {
          return false;
        }
        const searchable = [
          product.gemstoneType,
          formatGemstoneType(product.gemstoneType),
          product.jewelryType,
          formatJewelryType(product.jewelryType),
          product.colorType,
          product.certificateId,
          product.certificateAuthority,
          product.description,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return searchable.includes(searchTerm.toLowerCase());
      }),
    [
      allProducts,
      formatGemstoneType,
      formatJewelryType,
      isInSelectedPriceRange,
      searchTerm,
      selectedGemstoneType,
      selectedJewelryType,
    ],
  );

  const visibleProducts = useMemo(
    () =>
      [...filteredProducts].sort((a, b) => {
        const aMin = a.priceMin ?? Number.POSITIVE_INFINITY;
        const bMin = b.priceMin ?? Number.POSITIVE_INFINITY;
        return aMin - bMin;
      }),
    [filteredProducts],
  );

  const formatStatus = (status?: CertificateStatus) => {
    if (!status) return t("common.unknown");
    const normalized = normalizeStatus(status);
    if (normalized === "verified") return t("certificate.verified");
    if (normalized === "pending") return t("certificate.pending");
    return t("certificate.unverified");
  };

  const normalizeStatus = (status?: CertificateStatus) =>
    status ? status.toLowerCase() : "unverified";

  const isVerifiedStatus =
    normalizeStatus(currentProduct?.certificateStatus) === "verified";

  const statusBadgeClass = (status?: CertificateStatus) => {
    const normalized = normalizeStatus(status);
    if (normalized === "verified") {
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    }
    if (normalized === "pending") {
      return "bg-amber-100 text-amber-700 border-amber-200";
    }
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  const toCertificateStatus = (value: string): CertificateStatus => {
    const normalized = value.trim().toLowerCase();
    if (normalized === "verified") return "Verified";
    if (normalized === "pending") return "Pending";
    return "Unverified";
  };

  const normalizeProductForUi = (product: Product): ProductWithPrice => {
    const priceRaw = normalizePriceStorage(product.sellingPrice);
    const range = parsePriceRange(priceRaw);
    return {
      ...product,
      priceRaw,
      priceDisplay: formatPriceDisplay(priceRaw),
      priceMin: range?.priceMin,
      priceMax: range?.priceMax,
      certificateStatus: product.certificateStatus
        ? toCertificateStatus(product.certificateStatus)
        : "Pending",
      images: product.images?.length
        ? product.images
        : product.image
          ? [product.image]
          : [],
      image: product.images?.[0] || product.image,
    };
  };

  const getSellingPriceDisplay = useCallback(
    (product: ProductWithPrice) =>
      product.priceDisplay || formatPriceDisplay(product.sellingPrice),
    [formatPriceDisplay],
  );

  const parseNumber = (value: string) =>
    value === "" ? undefined : Number.parseFloat(value);

  const updateDimensionField = (
    key: keyof Product["dimensions"],
    value: Product["dimensions"][keyof Product["dimensions"]],
  ) => {
    setCurrentProduct((prev) =>
      prev
        ? {
            ...prev,
            dimensions: {
              ...prev.dimensions,
              [key]: value,
            },
          }
        : prev,
    );
  };

  const handleRequestBuyingPrice = async () => {
    setPriceRequestMessage("");
    setPriceRequestLoading(true);
    try {
      await permissionService.requestApproval({
        title: t("product.request.title"),
        area: "Pricing & billing",
      });
      setPriceRequestMessage(t("product.request.sent"));
    } catch {
      setPriceRequestMessage(t("product.request.failed"));
    } finally {
      setPriceRequestLoading(false);
    }
  };

  const totalCount = allProducts.length;
  const verifiedCount = allProducts.filter(
    (item) => normalizeStatus(item.certificateStatus) === "verified",
  ).length;
  const showBuyingPriceColumn =
    canViewBuyingPrice || allProducts.some((item) => item.buyingPrice);
  const pendingCount = allProducts.filter(
    (item) => normalizeStatus(item.certificateStatus) === "pending",
  ).length;
  const unverifiedCount = allProducts.filter(
    (item) => normalizeStatus(item.certificateStatus) === "unverified",
  ).length;

  const handleSaveProduct = async () => {
    if (!currentProduct || !canManageProducts) return;
    const validationError = validateProduct(currentProduct);
    if (validationError) {
      setError(validationError);
      return;
    }
    const sellingPriceInput = formatPriceInput(currentProduct.sellingPrice);
    if (sellingPriceInput && !/^\d+x$/.test(sellingPriceInput)) {
      const message = t("product.error.priceFormat");
      setError(message);
      showFeedback({ variant: "error", message });
      return;
    }
    const buyingPriceInput = formatPriceInput(currentProduct.buyingPrice);
    if (buyingPriceInput && !/^\d+x$/.test(buyingPriceInput)) {
      const message = t("product.error.priceFormat");
      setError(message);
      showFeedback({ variant: "error", message });
      return;
    }
    const normalizedSellingPrice = normalizePriceStorage(
      currentProduct.sellingPrice,
    );
    const normalizedBuyingPrice = normalizePriceStorage(
      currentProduct.buyingPrice,
    );
    startLoading();
    try {
      const { priceRaw, priceDisplay, priceMin, priceMax, ...rest } =
        currentProduct;
      void priceRaw;
      void priceDisplay;
      void priceMin;
      void priceMax;
      const payload: Partial<Product> = {
        ...rest,
        sellingPrice: normalizedSellingPrice || "",
        buyingPrice: normalizedBuyingPrice || "",
        images: currentProduct.images?.length
          ? currentProduct.images
          : currentProduct.image
            ? [currentProduct.image]
            : [],
        image: currentProduct.images?.[0] || currentProduct.image || "",
      };

      if (currentProduct.id) {
        const updated = await productService.updateProduct(
          currentProduct.id,
          payload,
        );
        setAllProducts((prev) =>
          prev.map((p) =>
            p.id === updated.id ? normalizeProductForUi(updated) : p,
          ),
        );
        showFeedback({
          variant: "success",
          message: t("product.feedback.updated"),
        });
      } else {
        delete payload.id;
        const created = await productService.createProduct(
          payload as Omit<Product, "id">,
        );
        setAllProducts((prev) => [normalizeProductForUi(created), ...prev]);
        showFeedback({
          variant: "success",
          message: t("product.feedback.created"),
        });
      }
      setIsDialogOpen(false);
      setCurrentProduct(null);
    } catch {
      const message = t("product.error.save");
      setError(message);
      showFeedback({ variant: "error", message });
    } finally {
      stopLoading();
    }
  };

  const handleEditProduct = (product: ProductWithPrice) => {
    if (!canManageProducts) return;
    setCurrentProduct(product);
    setIsDialogOpen(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!canManageProducts) return;
    startLoading();
    try {
      await productService.deleteProduct(id);
      setAllProducts((prev) => prev.filter((product) => product.id !== id));
      showFeedback({
        variant: "success",
        message: t("product.feedback.deleted"),
      });
    } catch {
      const message = t("product.error.delete");
      setError(message);
      showFeedback({ variant: "error", message });
    } finally {
      stopLoading();
    }
  };

  const openProductStatusDialog = (target: ProductWithPrice) => {
    if (!canManageProducts) return;
    setProductStatusTarget(target);
    setProductStatusOpen(true);
  };

  const handleConfirmProductStatus = async () => {
    if (!productStatusTarget || !canManageProducts) return;
    const nextIsActive = productStatusTarget.isActive === false;
    setProductStatusLoading(true);
    try {
      const updated = await productService.updateProductStatus(
        productStatusTarget.id,
        nextIsActive,
      );
      setAllProducts((prev) =>
        prev.map((entry) =>
          entry.id === updated.id ? normalizeProductForUi(updated) : entry,
        ),
      );
      toast.success(t("status.updateSuccess"));
    } catch {
      toast.error(t("status.updateFailed"));
    } finally {
      setProductStatusLoading(false);
      setProductStatusOpen(false);
      setProductStatusTarget(null);
    }
  };

  const getDefaultImage = (product: Product) =>
    product.images?.[0] || product.image;

  const handlePriceInputChange = (
    field: "sellingPrice" | "buyingPrice",
    value: string,
  ) => {
    const trimmed = value.trim().toLowerCase();
    if (trimmed === "") {
      setCurrentProduct((prev) => (prev ? { ...prev, [field]: "" } : prev));
      return;
    }
    if (!/^\d+x?$/.test(trimmed)) {
      return;
    }
    const normalized = /^(\d+)x$/.test(trimmed)
      ? `${trimmed.replace(/x$/, "")}xtr`
      : trimmed;
    setCurrentProduct((prev) =>
      prev ? { ...prev, [field]: normalized } : prev,
    );
  };

  const GridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {visibleProducts.map((product) => {
        const isActive = product.isActive !== false;
        return (
          <Card
            key={product.id}
            className={cn(
              "border-border/40 shadow-md hover:shadow-xl hover:border-border/70 transition-all duration-300 overflow-hidden group",
              !isActive && "opacity-70 grayscale",
            )}
          >
            <CardContent className="p-0">
              {/* Image Container */}
              <div className="relative w-full overflow-hidden bg-muted h-56">
                {getDefaultImage(product) ? (
                  <Image
                    src={getDefaultImage(product) as string}
                    alt={
                      formatGemstoneType(product.gemstoneType) ||
                      product.jewelryType ||
                      t("product.image.alt")
                    }
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                    unoptimized
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-3xl opacity-20">
                    💎
                  </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                  <StatusBadge isActive={isActive} />
                </div>
                <div className="absolute top-3 right-3">
                  <Badge
                    className={`text-[11px] font-semibold px-2.5 py-1 ${statusBadgeClass(
                      product.certificateStatus,
                    )}`}
                  >
                    {formatStatus(product.certificateStatus)}
                  </Badge>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-4 space-y-3.5">
                {/* Product Name & Description */}
                <div className="space-y-1.5">
                  <h3 className="font-semibold text-foreground text-base leading-snug line-clamp-1">
                    {formatGemstoneType(product.gemstoneType) ||
                      t("product.label.gemstone")}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {product.description || t("product.description.empty")}
                  </p>
                </div>

                {/* Price Section */}
                <div className="flex items-end justify-between pt-1.5 border-t border-border/30">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-1">
                      {t("product.label.sellingPrice")}
                    </p>
                    <p className="text-lg font-bold bg-linear-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      {getSellingPriceDisplay(product)}
                    </p>
                    {(canViewBuyingPrice || product.buyingPrice) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("product.buyLabel")}{" "}
                        {formatPriceDisplay(product.buyingPrice)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Specs Badges */}
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="text-xs">
                    {formatJewelryType(product.jewelryType) ||
                      t("product.label.jewelry")}
                  </Badge>
                  {product.colorType && (
                    <Badge variant="secondary" className="text-xs">
                      {product.colorType}
                    </Badge>
                  )}
                </div>

                {/* Details Grid */}
                <div className="text-xs text-muted-foreground space-y-1.5 py-2.5 border-y border-border/30">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {t("product.label.dimension")}:
                    </span>
                    <span className="text-right max-w-[60%]">
                      {formatDimensionSummary(product)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {t("product.label.certificateId")}:
                    </span>
                    <span className="text-right max-w-[60%]">
                      {product.certificateId || "-"}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between gap-1.5 pt-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="flex-1 h-9 text-xs"
                  >
                    <Link
                      href={`/product/${product.id}`}
                      aria-label={t("product.action.view")}
                    >
                      <Eye size={14} className="mr-1.5" />
                      {t("product.action.view")}
                    </Link>
                  </Button>
                  {canManageProducts ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        title={t("product.action.edit")}
                        onClick={() => handleEditProduct(product)}
                        disabled={!isActive}
                        className="h-9 w-9 p-0"
                      >
                        <Edit2 size={14} className="text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title={t("product.action.delete")}
                        onClick={() => handleDeleteProduct(product.id)}
                        disabled={!isActive}
                        className="h-9 w-9 p-0"
                      >
                        <Trash2 size={14} className="text-red-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 px-2 text-xs"
                        onClick={() => openProductStatusDialog(product)}
                      >
                        {isActive
                          ? t("status.deactivate")
                          : t("status.activate")}
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const TableView = () => (
    <div className="space-y-3">
      <div className="space-y-3 md:hidden">
        {visibleProducts.map((product) => {
          const isActive = product.isActive !== false;
          return (
            <div
              key={product.id}
              className={cn(
                "rounded-lg border border-border/50 bg-card/80 p-3 shadow-sm",
                !isActive && "opacity-70 grayscale",
              )}
            >
              <div className="relative w-full overflow-hidden rounded-md bg-muted aspect-square">
                {getDefaultImage(product) ? (
                  <Image
                    src={getDefaultImage(product) as string}
                    alt={
                      formatGemstoneType(product.gemstoneType) ||
                      product.jewelryType ||
                      t("product.image.alt")
                    }
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl opacity-30">
                    💎
                  </div>
                )}
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-sm font-semibold text-foreground">
                    {formatGemstoneType(product.gemstoneType) ||
                      t("product.label.gemstone")}
                  </div>
                  <Badge
                    className={`text-[11px] font-semibold ${statusBadgeClass(
                      product.certificateStatus,
                    )}`}
                  >
                    {formatStatus(product.certificateStatus)}
                  </Badge>
                  <StatusBadge isActive={isActive} />
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatJewelryType(product.jewelryType) || "—"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {product.colorType || "—"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDimensionSummary(product)}
                </div>
                <div className="text-sm font-semibold text-foreground">
                  {getSellingPriceDisplay(product)}
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Button variant="outline" size="sm" asChild className="h-8">
                    <Link href={`/product/${product.id}`}>
                      {t("product.action.view")}
                    </Link>
                  </Button>
                  {canManageProducts ? (
                    <ActionMenu
                      items={[
                        {
                          label: t("product.action.view"),
                          onClick: () => router.push(`/product/${product.id}`),
                        },
                        {
                          label: t("product.action.edit"),
                          onClick: () => handleEditProduct(product),
                          disabled: !isActive,
                        },
                        {
                          label: isActive
                            ? t("status.deactivate")
                            : t("status.activate"),
                          onClick: () => openProductStatusDialog(product),
                        },
                        {
                          label: t("product.action.delete"),
                          onClick: () => handleDeleteProduct(product.id),
                          disabled: !isActive,
                          destructive: true,
                        },
                      ]}
                    />
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="hidden md:block border border-border/50 rounded-lg overflow-hidden md:overflow-x-auto">
        <Table className="md:[&_th]:px-1.5 md:[&_td]:px-1.5 xl:[&_th]:px-2 xl:[&_td]:px-2">
          <TableHeader className="bg-muted/40">
            <TableRow className="border-border/40">
              <TableHead className="font-semibold text-foreground">
                {t("product.table.image")}
              </TableHead>
              <TableHead className="font-semibold text-foreground">
                {t("product.label.gemstone")}
              </TableHead>
              <TableHead className="font-semibold text-foreground">
                {t("product.label.jewelry")}
              </TableHead>
              <TableHead className="font-semibold text-foreground">
                {t("product.label.color")}
              </TableHead>
              <TableHead className="font-semibold text-foreground">
                {t("product.label.dimension")}
              </TableHead>
              {showBuyingPriceColumn && (
                <TableHead className="font-semibold text-foreground">
                  {t("product.label.buyingPrice")}
                </TableHead>
              )}
              <TableHead className="font-semibold text-foreground">
                {t("product.label.sellingPrice")}
              </TableHead>
              <TableHead className="font-semibold text-foreground">
                {t("product.label.certificateStatus")}
              </TableHead>
              <TableHead className="font-semibold text-foreground">
                {t("status.label")}
              </TableHead>
              <TableHead className="font-semibold text-foreground">
                {t("product.label.certificateId")}
              </TableHead>
              <TableHead className="font-semibold text-foreground">
                {t("product.label.certificateAuthority")}
              </TableHead>
              <TableHead className="font-semibold text-foreground">
                {t("product.label.certificateImage")}
              </TableHead>
              <TableHead className="text-center font-semibold text-foreground">
                {t("product.label.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleProducts.map((product, index) => {
              const isActive = product.isActive !== false;
              return (
                <TableRow
                  key={product.id}
                  className={cn(
                    "border-border/40 hover:bg-muted/30 transition-colors",
                    index % 2 === 0 ? "bg-background" : "bg-muted/10",
                    !isActive && "opacity-70 grayscale",
                  )}
                >
                  <TableCell className="py-4">
                    {getDefaultImage(product) ? (
                      <div className="relative w-10 h-10 rounded-md overflow-hidden border border-border/40">
                        <Image
                          src={getDefaultImage(product) as string}
                          alt={
                            formatGemstoneType(product.gemstoneType) ||
                            product.jewelryType ||
                            t("product.image.alt")
                          }
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center text-xs opacity-30">
                        💎
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {formatGemstoneType(product.gemstoneType) || "—"}
                  </TableCell>
                  <TableCell className="text-sm text-foreground">
                    {formatJewelryType(product.jewelryType) || "—"}
                  </TableCell>
                  <TableCell className="text-sm text-foreground">
                    {product.colorType || "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <div
                      className="max-w-xs truncate"
                      title={formatDimensionSummary(product)}
                    >
                      {formatDimensionSummary(product)}
                    </div>
                  </TableCell>
                  {showBuyingPriceColumn && (
                    <TableCell className="text-sm text-foreground font-medium">
                      {product.buyingPrice
                        ? formatPriceDisplay(product.buyingPrice)
                        : "—"}
                    </TableCell>
                  )}
                  <TableCell className="text-sm font-bold from-emerald-600/10 to-teal-600/10 text-emerald-700 ">
                    {getSellingPriceDisplay(product)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`text-xs font-semibold ${statusBadgeClass(
                        product.certificateStatus,
                      )}`}
                    >
                      {formatStatus(product.certificateStatus)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <StatusBadge isActive={isActive} />
                  </TableCell>
                  <TableCell className="text-xs text-foreground">
                    {product.certificateId || "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {product.certificateAuthority || "—"}
                  </TableCell>
                  <TableCell>
                    {product.certificateLink ? (
                      <a
                        href={product.certificateLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                      >
                        {t("common.view")} →
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="h-8 w-8 p-0"
                        title={t("product.action.viewDetails")}
                      >
                        <Link href={`/product/${product.id}`}>
                          <Eye size={14} className="text-amber-600" />
                        </Link>
                      </Button>
                      <ActionMenu
                        items={
                          canManageProducts
                            ? [
                                {
                                  label: t("product.action.view"),
                                  onClick: () =>
                                    router.push(`/product/${product.id}`),
                                },
                                {
                                  label: t("product.action.edit"),
                                  onClick: () => handleEditProduct(product),
                                  disabled: !isActive,
                                },
                                {
                                  label: isActive
                                    ? t("status.deactivate")
                                    : t("status.activate"),
                                  onClick: () =>
                                    openProductStatusDialog(product),
                                },
                                {
                                  label: t("product.action.delete"),
                                  onClick: () =>
                                    handleDeleteProduct(product.id),
                                  disabled: !isActive,
                                  destructive: true,
                                },
                              ]
                            : []
                        }
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 max-md:space-y-6">
      <PageHeader
        title={t("product.header.title")}
        subtitle={t("product.header.subtitle")}
        actions={
          <div className="flex flex-col items-end gap-3 max-md:items-stretch">
            {canManageProducts ? (
              <Button
                className="gap-2 font-semibold max-md:w-full"
                onClick={() => {
                  setCurrentProduct({
                    id: "",
                    description: "",
                    image: "",
                    images: [],
                    gemstoneType: "",
                    jewelryType: "",
                    colorType: "",
                    dimensions: {
                      innerDiameterMm: undefined,
                      ringSizeUS: undefined,
                      lengthMm: undefined,
                    },
                    buyingPrice: "",
                    sellingPrice: "",
                    certificateId: "",
                    certificateAuthority: "",
                    certificateStatus: "Pending",
                    certificateLink: "",
                  });
                  setIsDialogOpen(true);
                }}
              >
                <Plus size={18} />
                {t("product.add")}
              </Button>
            ) : null}
            {!canViewBuyingPrice ? (
              <div className="flex flex-col items-end gap-1.5 max-md:items-stretch">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={priceRequestLoading}
                  onClick={handleRequestBuyingPrice}
                  className="text-xs max-md:w-full"
                >
                  {priceRequestLoading
                    ? t("product.request.sending")
                    : t("product.request.cta")}
                </Button>
                {priceRequestMessage ? (
                  <span className="text-xs text-muted-foreground max-md:text-left">
                    {priceRequestMessage}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        }
      />

      {/* Statistics Cards - Improved Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-md:gap-3">
        {/* Total Count */}
        <Card className="border-border/50 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6 max-md:p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {t("product.summary.total")}
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {totalCount}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {t("product.summary.inventoryTotal")}
                </p>
              </div>
              <div className="text-4xl opacity-10">💎</div>
            </div>
          </CardContent>
        </Card>

        {/* Verified Count */}
        <Card className="border-border/50 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6 max-md:p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">
                  {t("certificate.verified")}
                </p>
                <p className="text-3xl font-bold text-emerald-600">
                  {verifiedCount}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {Math.round((verifiedCount / totalCount) * 100) || 0}%{" "}
                  {t("product.summary.certifiedPercentage")}
                </p>
              </div>
              <div className="text-4xl opacity-20">✓</div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Count */}
        <Card className="border-border/50 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6 max-md:p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">
                  {t("certificate.pending")}
                </p>
                <p className="text-3xl font-bold text-amber-600">
                  {pendingCount}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {t("product.summary.awaitingVerification")}
                </p>
              </div>
              <div className="text-4xl opacity-20">⏳</div>
            </div>
          </CardContent>
        </Card>

        {/* Unverified Count */}
        <Card className="border-border/50 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6 max-md:p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  {t("certificate.unverified")}
                </p>
                <p className="text-3xl font-bold text-slate-600">
                  {unverifiedCount}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {t("product.summary.needsVerification")}
                </p>
              </div>
              <div className="text-4xl opacity-20">–</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 px-6 py-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Filters and View Controls Card */}
      <Card className="border-border/50 shadow-lg">
        <CardHeader className="border-b border-border/40 pb-6 max-md:pb-4">
          <div className="flex items-center justify-between gap-4 max-md:flex-col max-md:items-start max-md:gap-3">
            <CardTitle className="text-xl">
              {t("product.title")}
              <span className="text-muted-foreground text-base font-normal ml-2">
                ({visibleProducts.length})
              </span>
            </CardTitle>

            <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-muted p-1">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="h-8 w-8 p-0"
                title={t("product.viewMode.grid")}
              >
                <Grid3X3 size={16} />
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="h-8 w-8 p-0"
                title={t("product.viewMode.table")}
              >
                <List size={16} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6 max-md:pt-4">
          <FilterBar
            filters={
              <>
                <div className="relative flex-1 min-w-60 lg:max-w-md max-md:min-w-0 max-md:w-full">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    size={16}
                  />
                  <Input
                    placeholder={t("product.search")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-background"
                  />
                </div>

                <div className="min-w-40 flex-1 sm:flex-none max-md:min-w-0 max-md:w-full max-md:flex-none">
                  <Select
                    value={selectedJewelryType || "all"}
                    onValueChange={(value) =>
                      setSelectedJewelryType(value === "all" ? "" : value)
                    }
                  >
                    <SelectTrigger className="min-w-40 max-md:w-full max-md:min-w-0">
                      <span className="text-xs text-muted-foreground mr-1 pointer-events-none">
                        {jewelryFilterLabel}:
                      </span>
                      <SelectValue placeholder={t("product.filter.all")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        {t("product.filter.all")}
                      </SelectItem>
                      {jewelryTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {jewelryTypeLabels[option.value] || option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="min-w-40 flex-1 sm:flex-none max-md:min-w-0 max-md:w-full max-md:flex-none">
                  <Select
                    value={selectedGemstoneType || "all"}
                    onValueChange={(value) =>
                      setSelectedGemstoneType(value === "all" ? "" : value)
                    }
                  >
                    <SelectTrigger className="min-w-40 max-md:w-full max-md:min-w-0">
                      <span className="text-xs text-muted-foreground mr-1 pointer-events-none">
                        {t("product.filter.gemstone")}:
                      </span>
                      <SelectValue placeholder={t("product.filter.all")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        {t("product.filter.all")}
                      </SelectItem>
                      {gemstoneTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range Filter */}
                <div className="min-w-40 flex-1 sm:flex-none max-md:min-w-0 max-md:w-full max-md:flex-none">
                  <Select
                    value={selectedPriceRange || "all"}
                    onValueChange={(value) =>
                      setSelectedPriceRange(value === "all" ? "" : value)
                    }
                  >
                    <SelectTrigger className="min-w-40 max-md:w-full max-md:min-w-0">
                      <span className="text-xs text-muted-foreground mr-1 pointer-events-none">
                        {t("product.filter.price")}:
                      </span>
                      <SelectValue placeholder={t("product.filter.all")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        {t("product.filter.all")}
                      </SelectItem>
                      {priceRangeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            }
          />
        </CardContent>

        {/* Content Area */}
        <CardContent className="pt-8 max-md:pt-6">
          {/* Loading State */}
          {isLoading ? (
            <div className="text-center py-16">
              <div className="text-sm text-muted-foreground">
                {t("product.loading")}
              </div>
            </div>
          ) : visibleProducts.length === 0 ? (
            /* Empty State */
            <div className="text-center py-16">
              <div className="text-6xl mb-4 opacity-50">💎</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {t("product.empty.title")}
              </h3>
              <p className="text-muted-foreground mb-6">
                {t("product.empty.hint")}
              </p>
              {canManageProducts && (
                <Button
                  onClick={() => {
                    setCurrentProduct({
                      id: "",
                      description: "",
                      image: "",
                      images: [],
                      gemstoneType: "",
                      jewelryType: "",
                      colorType: "",
                      dimensions: {
                        innerDiameterMm: undefined,
                        ringSizeUS: undefined,
                        lengthMm: undefined,
                      },
                      buyingPrice: "",
                      sellingPrice: "",
                      certificateId: "",
                      certificateAuthority: "",
                      certificateStatus: "Pending",
                      certificateLink: "",
                    });
                    setIsDialogOpen(true);
                  }}
                  className="gap-2"
                >
                  <Plus size={16} />
                  {t("product.empty.addFirst")}
                </Button>
              )}
            </div>
          ) : /* Grid or Table View */
          viewMode === "grid" ? (
            <GridView />
          ) : (
            <TableView />
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentProduct?.id
                ? t("product.dialog.edit")
                : t("product.dialog.add")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("product.image.label")}</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                disabled={!canManageProducts || isUploadingImage}
                className="hidden"
                aria-label={t("product.image.label")}
                onChange={async (e) => {
                  const inputEl = e.currentTarget;
                  const files = Array.from(inputEl.files || []);
                  if (!files.length) {
                    setSelectedFilesLabel(t("product.noFile"));
                    return;
                  }
                  setSelectedFilesLabel(
                    files.length === 1
                      ? files[0].name
                      : t("product.filesSelected", { count: files.length }),
                  );
                  try {
                    setIsUploadingImage(true);
                    const uploadedUrls: string[] = [];
                    for (const file of files) {
                      const base64 = await fileToBase64(file);
                      const result = await uploadImageBase64(base64);
                      uploadedUrls.push(result.url);
                    }
                    setCurrentProduct((prev) => {
                      const nextImages = [
                        ...(prev?.images || (prev?.image ? [prev.image] : [])),
                        ...uploadedUrls,
                      ];
                      return {
                        ...prev!,
                        images: nextImages,
                        image: nextImages[0] || "",
                      };
                    });
                  } catch (uploadError) {
                    setError(
                      uploadError instanceof Error
                        ? uploadError.message
                        : t("product.error.upload"),
                    );
                  } finally {
                    setIsUploadingImage(false);
                    if (inputEl) {
                      inputEl.value = "";
                    }
                  }
                }}
              />
              <div className="flex items-center gap-3 rounded-md border border-input bg-background px-3 py-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!canManageProducts || isUploadingImage}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {t("product.image.choose")}
                </Button>
                <div className="h-5 w-px bg-border" />
                <span className="text-xs text-muted-foreground">
                  {selectedFilesLabel}
                </span>
              </div>
              {isUploadingImage ? (
                <div className="text-xs text-muted-foreground">
                  {t("product.image.uploading")}
                </div>
              ) : null}
              {currentProduct?.images?.length ? (
                <div className="flex flex-wrap gap-2">
                  {currentProduct.images.map((url, index) => (
                    <div
                      key={`${url}-${index}`}
                      className={`relative h-16 w-16 rounded-md overflow-hidden border ${
                        index === 0 ? "border-sky-500" : "border-border"
                      }`}
                      title={index === 0 ? t("product.image.defaultFirst") : ""}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentProduct((prev) => {
                            if (!prev) return prev;
                            const nextImages = (prev.images || []).filter(
                              (img, imgIndex) =>
                                !(img === url && imgIndex === index),
                            );
                            return {
                              ...prev,
                              images: nextImages,
                              image: nextImages[0] || "",
                            };
                          });
                        }}
                        className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-black/80"
                        aria-label={t("product.image.remove")}
                        title={t("product.image.remove")}
                      >
                        ×
                      </button>
                      <Image
                        src={url}
                        alt={t("product.image.altIndex", { index: index + 1 })}
                        width={64}
                        height={64}
                        className="h-full w-full object-cover"
                        unoptimized
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            <Label>{t("product.label.description")}</Label>
            <Textarea
              value={currentProduct?.description || ""}
              onChange={(e) =>
                setCurrentProduct((prev) => ({
                  ...prev!,
                  description: e.target.value,
                }))
              }
            />
            <Label>{t("product.label.gemstone")}</Label>
            <Select
              value={currentProduct?.gemstoneType || ""}
              onValueChange={(value) =>
                setCurrentProduct((prev) =>
                  prev
                    ? {
                        ...prev,
                        gemstoneType: value as Product["gemstoneType"],
                      }
                    : prev,
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t("product.placeholder.gemstone")} />
              </SelectTrigger>
              <SelectContent>
                {gemstoneTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Label>{t("product.label.jewelry")}</Label>
            <Select
              value={currentProduct?.jewelryType || ""}
              onValueChange={(value) =>
                setCurrentProduct((prev) =>
                  prev
                    ? {
                        ...prev,
                        jewelryType: value as Product["jewelryType"],
                      }
                    : prev,
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t("product.placeholder.jewelry")} />
              </SelectTrigger>
              <SelectContent>
                {jewelryTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Label>{t("product.label.color")}</Label>
            <Input
              value={currentProduct?.colorType || ""}
              onChange={(e) =>
                setCurrentProduct((prev) => ({
                  ...prev!,
                  colorType: e.target.value,
                }))
              }
            />
            <Label>{t("product.label.dimension")}</Label>
            {currentProduct?.jewelryType === "Bracelet" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  type="number"
                  value={currentProduct?.dimensions?.innerDiameterMm ?? ""}
                  onChange={(e) =>
                    updateDimensionField(
                      "innerDiameterMm",
                      parseNumber(e.target.value),
                    )
                  }
                  placeholder={t("product.placeholder.innerDiameter")}
                />
                <Input
                  type="number"
                  value={currentProduct?.dimensions?.widthMm ?? ""}
                  onChange={(e) =>
                    updateDimensionField("widthMm", parseNumber(e.target.value))
                  }
                  placeholder={t("product.placeholder.width")}
                />
                <Input
                  type="number"
                  value={currentProduct?.dimensions?.thicknessMm ?? ""}
                  onChange={(e) =>
                    updateDimensionField(
                      "thicknessMm",
                      parseNumber(e.target.value),
                    )
                  }
                  placeholder={t("product.placeholder.thickness")}
                />
                <Select
                  value={currentProduct?.dimensions?.bangleProfile || ""}
                  onValueChange={(value) =>
                    updateDimensionField(
                      "bangleProfile",
                      value as Product["dimensions"]["bangleProfile"],
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("product.placeholder.bangleProfile")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {bangleProfileOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={currentProduct?.dimensions?.shape || ""}
                  onValueChange={(value) =>
                    updateDimensionField(
                      "shape",
                      value as Product["dimensions"]["shape"],
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("product.placeholder.bangleShape")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {bangleShapeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            {currentProduct?.jewelryType === "Beadedbracelet" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  type="number"
                  value={currentProduct?.dimensions?.beadDiameterMm ?? ""}
                  onChange={(e) =>
                    updateDimensionField(
                      "beadDiameterMm",
                      parseNumber(e.target.value),
                    )
                  }
                  placeholder={t("product.placeholder.beadSize")}
                />
                <Input
                  type="number"
                  value={currentProduct?.dimensions?.maxBeadDiameterMm ?? ""}
                  onChange={(e) =>
                    updateDimensionField(
                      "maxBeadDiameterMm",
                      parseNumber(e.target.value),
                    )
                  }
                  placeholder={t("product.placeholder.beadMax")}
                />
                <Input
                  type="number"
                  value={currentProduct?.dimensions?.minBeadDiameterMm ?? ""}
                  onChange={(e) =>
                    updateDimensionField(
                      "minBeadDiameterMm",
                      parseNumber(e.target.value),
                    )
                  }
                  placeholder={t("product.placeholder.beadMin")}
                />
                <Input
                  type="number"
                  value={currentProduct?.dimensions?.beadCount ?? ""}
                  onChange={(e) =>
                    updateDimensionField(
                      "beadCount",
                      parseNumber(e.target.value),
                    )
                  }
                  placeholder={t("product.placeholder.beadCount")}
                />
                <Input
                  type="number"
                  value={currentProduct?.dimensions?.lengthMm ?? ""}
                  onChange={(e) =>
                    updateDimensionField(
                      "lengthMm",
                      parseNumber(e.target.value),
                    )
                  }
                  placeholder={t("product.placeholder.beadLength")}
                />
              </div>
            ) : null}
            {currentProduct?.jewelryType === "Pendant" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  type="number"
                  value={currentProduct?.dimensions?.lengthMm ?? ""}
                  onChange={(e) =>
                    updateDimensionField(
                      "lengthMm",
                      parseNumber(e.target.value),
                    )
                  }
                  placeholder={t("product.placeholder.length")}
                />
                <Input
                  type="number"
                  value={currentProduct?.dimensions?.widthMm ?? ""}
                  onChange={(e) =>
                    updateDimensionField("widthMm", parseNumber(e.target.value))
                  }
                  placeholder={t("product.placeholder.width")}
                />
                <Input
                  type="number"
                  value={currentProduct?.dimensions?.thicknessMm ?? ""}
                  onChange={(e) =>
                    updateDimensionField(
                      "thicknessMm",
                      parseNumber(e.target.value),
                    )
                  }
                  placeholder={t("product.placeholder.thickness")}
                />
              </div>
            ) : null}
            {currentProduct?.jewelryType === "Rings" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  type="number"
                  value={currentProduct?.dimensions?.ringSize ?? ""}
                  onChange={(e) =>
                    updateDimensionField(
                      "ringSize",
                      parseNumber(e.target.value),
                    )
                  }
                  placeholder={t("product.placeholder.ringSize")}
                />
                <Input
                  type="number"
                  value={currentProduct?.dimensions?.innerDiameterMm ?? ""}
                  onChange={(e) =>
                    updateDimensionField(
                      "innerDiameterMm",
                      parseNumber(e.target.value),
                    )
                  }
                  placeholder={t("product.placeholder.innerDiameter")}
                />
                <Input
                  type="number"
                  value={currentProduct?.dimensions?.widthMm ?? ""}
                  onChange={(e) =>
                    updateDimensionField("widthMm", parseNumber(e.target.value))
                  }
                  placeholder={t("product.placeholder.ringWidth")}
                />
                <Input
                  type="number"
                  value={currentProduct?.dimensions?.thicknessMm ?? ""}
                  onChange={(e) =>
                    updateDimensionField(
                      "thicknessMm",
                      parseNumber(e.target.value),
                    )
                  }
                  placeholder={t("product.placeholder.thickness")}
                />
              </div>
            ) : null}
            {currentProduct?.jewelryType === "Earrings" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  value={currentProduct?.dimensions?.earringType || ""}
                  onValueChange={(value) =>
                    updateDimensionField(
                      "earringType",
                      value as Product["dimensions"]["earringType"],
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("product.placeholder.earringType")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {earringTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  value={currentProduct?.dimensions?.lengthMm ?? ""}
                  onChange={(e) =>
                    updateDimensionField(
                      "lengthMm",
                      parseNumber(e.target.value),
                    )
                  }
                  placeholder={t("product.placeholder.length")}
                />
                <Input
                  type="number"
                  value={currentProduct?.dimensions?.widthMm ?? ""}
                  onChange={(e) =>
                    updateDimensionField("widthMm", parseNumber(e.target.value))
                  }
                  placeholder={t("product.placeholder.width")}
                />
                <Input
                  type="number"
                  value={currentProduct?.dimensions?.thicknessMm ?? ""}
                  onChange={(e) =>
                    updateDimensionField(
                      "thicknessMm",
                      parseNumber(e.target.value),
                    )
                  }
                  placeholder={t("product.placeholder.thickness")}
                />
              </div>
            ) : null}
            {canViewBuyingPrice && (
              <>
                <Label>{t("product.label.buyingPrice")}</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={formatPriceInput(currentProduct?.buyingPrice)}
                  onChange={(e) =>
                    handlePriceInputChange("buyingPrice", e.target.value)
                  }
                />
              </>
            )}
            <Label>{t("product.label.sellingPrice")}</Label>
            <Input
              type="text"
              inputMode="numeric"
              value={formatPriceInput(currentProduct?.sellingPrice)}
              onChange={(e) =>
                handlePriceInputChange("sellingPrice", e.target.value)
              }
            />
            <Label>{t("product.label.certificateStatus")}</Label>
            <Select
              value={
                currentProduct?.certificateStatus
                  ? toCertificateStatus(currentProduct.certificateStatus)
                  : "Pending"
              }
              onValueChange={(value) =>
                setCurrentProduct((prev) => ({
                  ...prev!,
                  certificateStatus: toCertificateStatus(value),
                }))
              }
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={t("product.placeholder.certificateStatus")}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Verified">
                  {t("certificate.verified")}
                </SelectItem>
                <SelectItem value="Pending">
                  {t("certificate.pending")}
                </SelectItem>
                <SelectItem value="Unverified">
                  {t("certificate.unverified")}
                </SelectItem>
              </SelectContent>
            </Select>
            <Label>{t("product.label.certificateId")}</Label>
            <Input
              value={currentProduct?.certificateId || ""}
              onChange={(e) =>
                setCurrentProduct((prev) => ({
                  ...prev!,
                  certificateId: e.target.value,
                }))
              }
              disabled={!isVerifiedStatus}
            />
            <Label>{t("product.label.certificateAuthority")}</Label>
            <Input
              value={currentProduct?.certificateAuthority || ""}
              onChange={(e) =>
                setCurrentProduct((prev) => ({
                  ...prev!,
                  certificateAuthority: e.target.value,
                }))
              }
              disabled={!isVerifiedStatus}
            />
            <Label>{t("product.label.certificateImage")}</Label>
            <Input
              value={currentProduct?.certificateLink || ""}
              onChange={(e) =>
                setCurrentProduct((prev) => ({
                  ...prev!,
                  certificateLink: e.target.value,
                }))
              }
              disabled={!isVerifiedStatus}
            />
          </div>
          <DialogFooter>
            <Button
              variant="default"
              onClick={handleSaveProduct}
              disabled={!canManageProducts}
            >
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={productStatusOpen} onOpenChange={setProductStatusOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("status.confirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("status.confirmProduct", {
                action:
                  productStatusTarget?.isActive === false
                    ? t("status.activate")
                    : t("status.deactivate"),
                name:
                  formatGemstoneType(productStatusTarget?.gemstoneType) ||
                  productStatusTarget?.jewelryType ||
                  t("product.label.gemstone"),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmProductStatus}
              disabled={productStatusLoading}
            >
              {productStatusLoading
                ? t("common.loading")
                : productStatusTarget?.isActive === false
                  ? t("status.activate")
                  : t("status.deactivate")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
