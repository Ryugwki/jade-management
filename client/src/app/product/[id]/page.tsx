"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode, DragEvent } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  InfoRowItem,
  SpecificationList,
  CertificateStatusBadge,
  PriceDisplay,
} from "@/components/ProductInfoSection";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Product, CertificateStatus } from "@/types/product";
import * as productService from "@/services/productService";
import * as uploadService from "@/services/uploadService";
import { useTranslation } from "@/contexts/LanguageContext";
import { usePermission } from "@/hooks/usePermission";
import * as permissionService from "@/services/permissionService";
import { toast } from "sonner";

const normalizeStatus = (status?: CertificateStatus) =>
  status ? status.toLowerCase() : "unverified";

const formatMoney = (value?: string) => {
  if (value === undefined || value === null || value === "") return "0";
  return value;
};

const formatMm = (value?: number) =>
  value === undefined || value === null ? "" : `${value} mm`;

const formatNumberValue = (value?: number) =>
  value === undefined || value === null ? "" : String(value);

const parseNumberInput = (value: string) =>
  value.trim() === "" ? undefined : Number(value);

export default function ProductDetailsPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const router = useRouter();
  const { t } = useTranslation();
  const canViewBuyingPrice = usePermission("pricing", "read");
  const canManageProducts = usePermission("product", "manage");
  const [product, setProduct] = useState<Product | null>(null);
  const [draft, setDraft] = useState<Product | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(
    null,
  );
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState("");
  const [uploadQueue, setUploadQueue] = useState<
    Array<{ id: string; name: string; status: "uploading" | "done" | "error" }>
  >([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const hasBuyingPrice =
    product?.buyingPrice !== undefined &&
    product?.buyingPrice !== null &&
    product?.buyingPrice !== "";
  const showBuyingPrice = canViewBuyingPrice || hasBuyingPrice;

  const normalizeProduct = (data: Product): Product => ({
    ...data,
    images: data.images?.length ? data.images : data.image ? [data.image] : [],
    image: data.images?.[0] || data.image,
  });

  const viewProduct = useMemo(
    () => (isEditing ? draft || product : product),
    [draft, isEditing, product],
  );

  const updateDraft = (changes: Partial<Product>) => {
    setDraft((prev) => (prev ? { ...prev, ...changes } : prev));
  };

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const updateDraftDimensions = (changes: Partial<Product["dimensions"]>) => {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            dimensions: {
              ...prev.dimensions,
              ...changes,
            },
          }
        : prev,
    );
  };

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

  const handleOpenPreview = (url: string) => {
    setPreviewImage(url);
    setPreviewOpen(true);
  };

  const updateUploadItem = (
    id: string,
    changes: Partial<{ status: "uploading" | "done" | "error" }>,
  ) => {
    setUploadQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...changes } : item)),
    );
  };

  const readFileAsBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve(typeof reader.result === "string" ? reader.result : "");
      reader.onerror = () => reject(new Error("File read failed"));
      reader.readAsDataURL(file);
    });

  const handleUploadImages = async (files: FileList | null) => {
    if (!draft || !files || files.length === 0) return;
    setImageUploadError("");
    setIsUploadingImage(true);
    const batch = Array.from(files).map((file) => ({
      file,
      id: `${file.name}-${file.size}-${file.lastModified}`,
    }));
    setUploadQueue((prev) => [
      ...prev,
      ...batch.map((entry) => ({
        id: entry.id,
        name: entry.file.name,
        status: "uploading" as const,
      })),
    ]);
    try {
      const uploads = await Promise.all(
        batch.map(async ({ file, id }) => {
          const base64 = await readFileAsBase64(file);
          const result = await uploadService.uploadImageBase64(
            base64,
            "products",
          );
          updateUploadItem(id, { status: "done" });
          return result.url;
        }),
      );
      const nextImages = [...(draft.images || []), ...uploads];
      updateDraft({
        images: nextImages,
        image: nextImages[0] || "",
      });
    } catch {
      setImageUploadError(t("product.error.upload"));
      batch.forEach(({ id }) => updateUploadItem(id, { status: "error" }));
      toast.error(t("product.error.upload"));
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleAddImage = () => {
    if (!draft) return;
    const trimmed = newImageUrl.trim();
    if (!trimmed) return;
    const nextImages = [...(draft.images || []), trimmed];
    updateDraft({
      images: nextImages,
      image: nextImages[0] || "",
    });
    setNewImageUrl("");
  };

  const handleRemoveImage = (index: number) => {
    if (!draft) return;
    const nextImages = (draft.images || []).filter((_, i) => i !== index);
    updateDraft({
      images: nextImages,
      image: nextImages[0] || "",
    });
  };

  const handleSetPrimaryImage = (index: number) => {
    if (!draft || !draft.images?.length) return;
    const current = draft.images[index];
    if (!current) return;
    const nextImages = [current, ...draft.images.filter((_, i) => i !== index)];
    updateDraft({
      images: nextImages,
      image: nextImages[0] || "",
    });
  };

  const handleReorderImage = (from: number, to: number) => {
    if (!draft || !draft.images?.length) return;
    if (from === to) return;
    const nextImages = [...draft.images];
    const [moved] = nextImages.splice(from, 1);
    nextImages.splice(to, 0, moved);
    updateDraft({
      images: nextImages,
      image: nextImages[0] || "",
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedImageIndex(index);
  };

  const handleDragEnter = (index: number) => {
    setDragOverIndex(index);
  };

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (index: number) => {
    if (draggedImageIndex === null) return;
    handleReorderImage(draggedImageIndex, index);
    setDraggedImageIndex(null);
    setDragOverIndex(null);
  };

  const handleImageUrlChange = (index: number, value: string) => {
    if (!draft) return;
    const nextImages = [...(draft.images || [])];
    nextImages[index] = value;
    updateDraft({
      images: nextImages,
      image: nextImages[0] || "",
    });
  };

  const handleStartEdit = () => {
    if (!product || !canManageProducts) return;
    setDraft({
      ...product,
      dimensions: { ...product.dimensions },
      certificateStatus: normalizeStatus(product.certificateStatus),
    });
    setFieldErrors({});
    setNewImageUrl("");
    setImageUploadError("");
    setUploadQueue([]);
    setDragOverIndex(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setDraft(null);
    setFieldErrors({});
    setNewImageUrl("");
    setImageUploadError("");
    setUploadQueue([]);
    setDragOverIndex(null);
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!draft || !product || !canManageProducts) return;
    const requiredMessage = t("form.required");
    const nextErrors: Record<string, string> = {};
    if (!draft.gemstoneType) nextErrors.gemstoneType = requiredMessage;
    if (!draft.jewelryType) nextErrors.jewelryType = requiredMessage;
    if (!draft.colorType) nextErrors.colorType = requiredMessage;
    if (!draft.sellingPrice) nextErrors.sellingPrice = requiredMessage;
    if (!draft.certificateId) nextErrors.certificateId = requiredMessage;
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      toast.error(t("product.error.missing"));
      return;
    }
    setIsSaving(true);
    try {
      const payload: Partial<Product> = {
        ...draft,
        images: draft.images?.length
          ? draft.images
          : draft.image
            ? [draft.image]
            : [],
        image: draft.images?.[0] || draft.image || "",
        certificateStatus: normalizeStatus(draft.certificateStatus),
      };
      const updated = await productService.updateProduct(product.id, payload);
      setProduct(normalizeProduct(updated));
      setDraft(null);
      setIsEditing(false);
      toast.success(t("product.feedback.updated"));
    } catch {
      toast.error(t("product.error.save"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmStatus = async () => {
    if (!product || !canManageProducts) return;
    const nextIsActive = product.isActive === false;
    setStatusLoading(true);
    try {
      const updated = await productService.updateProductStatus(
        product.id,
        nextIsActive,
      );
      setProduct((prev) => (prev ? normalizeProduct(updated) : prev));
      toast.success(t("status.updateSuccess"));
    } catch {
      toast.error(t("status.updateFailed"));
    } finally {
      setStatusLoading(false);
      setStatusOpen(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await productService.getProduct(id);
        setProduct(normalizeProduct(data));
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

  const dimensionEntries = getDimensionEntriesL(viewProduct || product);

  const isActive = (viewProduct || product).isActive !== false;

  const primaryImage = (viewProduct || product).images?.[0];
  const secondaryImages = (viewProduct || product).images?.slice(1) ?? [];
  const draftImages = draft?.images ?? [];

  const gemstoneOptions = [
    { value: "Nuo", label: t("gemstone.nuo") },
    { value: "Nuo transformation", label: t("gemstone.nuoTransformation") },
    { value: "Nuo ice", label: t("gemstone.nuoIce") },
    { value: "Ice", label: t("gemstone.ice") },
    { value: "High ice", label: t("gemstone.highIce") },
    { value: "Glass", label: t("gemstone.glass") },
  ];

  const jewelryOptions = [
    { value: "Bracelet", label: t("product.jewelry.bracelet") },
    { value: "Beadedbracelet", label: t("product.jewelry.beadedBracelet") },
    { value: "Pendant", label: t("product.jewelry.pendant") },
    { value: "Earrings", label: t("product.jewelry.earrings") },
    { value: "Rings", label: t("product.jewelry.rings") },
  ];

  const certificateStatusOptions = [
    { value: "unverified", label: t("certificate.unverified") },
    { value: "pending", label: t("certificate.pending") },
    { value: "verified", label: t("certificate.verified") },
  ];

  const renderEditableRow = (
    label: string,
    input: ReactNode,
    error?: string,
  ) => (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-border/40 last:border-0 text-sm">
      <span className="text-muted-foreground font-medium pt-2">{label}</span>
      <div className="w-full max-w-xs">
        {input}
        {error ? (
          <p className="mt-1 text-xs text-destructive">{error}</p>
        ) : null}
      </div>
    </div>
  );

  const renderDimensionInputs = () => {
    const jewelryType = draft?.jewelryType;
    if (!jewelryType) return null;

    if (jewelryType === "Bracelet") {
      return (
        <>
          {renderEditableRow(
            t("product.dim.ni"),
            <Input
              type="number"
              value={formatNumberValue(draft?.dimensions?.innerDiameterMm)}
              onChange={(event) =>
                updateDraftDimensions({
                  innerDiameterMm: parseNumberInput(event.target.value),
                })
              }
            />,
          )}
          {renderEditableRow(
            t("product.dim.width"),
            <Input
              type="number"
              value={formatNumberValue(draft?.dimensions?.widthMm)}
              onChange={(event) =>
                updateDraftDimensions({
                  widthMm: parseNumberInput(event.target.value),
                })
              }
            />,
          )}
          {renderEditableRow(
            t("product.dim.thickness"),
            <Input
              type="number"
              value={formatNumberValue(draft?.dimensions?.thicknessMm)}
              onChange={(event) =>
                updateDraftDimensions({
                  thicknessMm: parseNumberInput(event.target.value),
                })
              }
            />,
          )}
          {renderEditableRow(
            t("product.placeholder.bangleShape"),
            <Select
              value={draft?.dimensions?.shape || ""}
              onValueChange={(value) =>
                updateDraftDimensions({ shape: value || "" })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t("common.select")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="round">
                  {t("product.bangle.shapeRound")}
                </SelectItem>
                <SelectItem value="oval">
                  {t("product.bangle.shapeOval")}
                </SelectItem>
              </SelectContent>
            </Select>,
          )}
          {renderEditableRow(
            t("product.placeholder.bangleProfile"),
            <Select
              value={draft?.dimensions?.bangleProfile || ""}
              onValueChange={(value) =>
                updateDraftDimensions({ bangleProfile: value || "" })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t("common.select")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="round">
                  {t("product.bangle.profileRound")}
                </SelectItem>
                <SelectItem value="flat">
                  {t("product.bangle.profileFlat")}
                </SelectItem>
              </SelectContent>
            </Select>,
          )}
        </>
      );
    }

    if (jewelryType === "Beadedbracelet") {
      return (
        <>
          {renderEditableRow(
            t("product.dim.beadSize"),
            <Input
              type="number"
              value={formatNumberValue(draft?.dimensions?.beadDiameterMm)}
              onChange={(event) =>
                updateDraftDimensions({
                  beadDiameterMm: parseNumberInput(event.target.value),
                })
              }
            />,
          )}
          {renderEditableRow(
            t("product.placeholder.beadMax"),
            <Input
              type="number"
              value={formatNumberValue(draft?.dimensions?.maxBeadDiameterMm)}
              onChange={(event) =>
                updateDraftDimensions({
                  maxBeadDiameterMm: parseNumberInput(event.target.value),
                })
              }
            />,
          )}
          {renderEditableRow(
            t("product.placeholder.beadMin"),
            <Input
              type="number"
              value={formatNumberValue(draft?.dimensions?.minBeadDiameterMm)}
              onChange={(event) =>
                updateDraftDimensions({
                  minBeadDiameterMm: parseNumberInput(event.target.value),
                })
              }
            />,
          )}
          {renderEditableRow(
            t("product.dim.beadCount"),
            <Input
              type="number"
              value={formatNumberValue(draft?.dimensions?.beadCount)}
              onChange={(event) =>
                updateDraftDimensions({
                  beadCount: parseNumberInput(event.target.value),
                })
              }
            />,
          )}
          {renderEditableRow(
            t("product.placeholder.beadLength"),
            <Input
              type="number"
              value={formatNumberValue(draft?.dimensions?.lengthMm)}
              onChange={(event) =>
                updateDraftDimensions({
                  lengthMm: parseNumberInput(event.target.value),
                })
              }
            />,
          )}
        </>
      );
    }

    if (jewelryType === "Pendant") {
      return (
        <>
          {renderEditableRow(
            t("product.dim.length"),
            <Input
              type="number"
              value={formatNumberValue(draft?.dimensions?.lengthMm)}
              onChange={(event) =>
                updateDraftDimensions({
                  lengthMm: parseNumberInput(event.target.value),
                })
              }
            />,
          )}
          {renderEditableRow(
            t("product.dim.width"),
            <Input
              type="number"
              value={formatNumberValue(draft?.dimensions?.widthMm)}
              onChange={(event) =>
                updateDraftDimensions({
                  widthMm: parseNumberInput(event.target.value),
                })
              }
            />,
          )}
          {renderEditableRow(
            t("product.dim.thickness"),
            <Input
              type="number"
              value={formatNumberValue(draft?.dimensions?.thicknessMm)}
              onChange={(event) =>
                updateDraftDimensions({
                  thicknessMm: parseNumberInput(event.target.value),
                })
              }
            />,
          )}
        </>
      );
    }

    if (jewelryType === "Rings") {
      return (
        <>
          {renderEditableRow(
            t("product.placeholder.ringSize"),
            <Input
              type="number"
              value={formatNumberValue(draft?.dimensions?.ringSize)}
              onChange={(event) =>
                updateDraftDimensions({
                  ringSize: parseNumberInput(event.target.value),
                })
              }
            />,
          )}
          {renderEditableRow(
            t("product.dim.ni"),
            <Input
              type="number"
              value={formatNumberValue(draft?.dimensions?.innerDiameterMm)}
              onChange={(event) =>
                updateDraftDimensions({
                  innerDiameterMm: parseNumberInput(event.target.value),
                })
              }
            />,
          )}
          {renderEditableRow(
            t("product.placeholder.ringWidth"),
            <Input
              type="number"
              value={formatNumberValue(draft?.dimensions?.widthMm)}
              onChange={(event) =>
                updateDraftDimensions({
                  widthMm: parseNumberInput(event.target.value),
                })
              }
            />,
          )}
          {renderEditableRow(
            t("product.dim.thickness"),
            <Input
              type="number"
              value={formatNumberValue(draft?.dimensions?.thicknessMm)}
              onChange={(event) =>
                updateDraftDimensions({
                  thicknessMm: parseNumberInput(event.target.value),
                })
              }
            />,
          )}
        </>
      );
    }

    if (jewelryType === "Earrings") {
      return (
        <>
          {renderEditableRow(
            t("product.placeholder.earringType"),
            <Select
              value={draft?.dimensions?.earringType || ""}
              onValueChange={(value) =>
                updateDraftDimensions({ earringType: value || "" })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t("common.select")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stud">
                  {t("product.earring.stud")}
                </SelectItem>
                <SelectItem value="drop">
                  {t("product.earring.drop")}
                </SelectItem>
                <SelectItem value="hoop">
                  {t("product.earring.hoop")}
                </SelectItem>
                <SelectItem value="dangle">
                  {t("product.earring.dangle")}
                </SelectItem>
              </SelectContent>
            </Select>,
          )}
          {renderEditableRow(
            t("product.dim.length"),
            <Input
              type="number"
              value={formatNumberValue(draft?.dimensions?.lengthMm)}
              onChange={(event) =>
                updateDraftDimensions({
                  lengthMm: parseNumberInput(event.target.value),
                })
              }
            />,
          )}
          {renderEditableRow(
            t("product.dim.width"),
            <Input
              type="number"
              value={formatNumberValue(draft?.dimensions?.widthMm)}
              onChange={(event) =>
                updateDraftDimensions({
                  widthMm: parseNumberInput(event.target.value),
                })
              }
            />,
          )}
          {renderEditableRow(
            t("product.dim.thickness"),
            <Input
              type="number"
              value={formatNumberValue(draft?.dimensions?.thicknessMm)}
              onChange={(event) =>
                updateDraftDimensions({
                  thicknessMm: parseNumberInput(event.target.value),
                })
              }
            />,
          )}
        </>
      );
    }

    return null;
  };

  return (
    <>
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <PageHeader
          eyebrow={t("product.label.gemstone")}
          title={
            <div className="flex flex-wrap items-center gap-3">
              <span>
                {formatGemstoneTypeL((viewProduct || product).gemstoneType) ||
                  formatJewelryTypeL((viewProduct || product).jewelryType) ||
                  t("product.label.gemstone")}
              </span>
              <StatusBadge isActive={isActive} />
              <CertificateStatusBadge
                status={formatStatusBadge(
                  (viewProduct || product).certificateStatus,
                )}
                large
              />
            </div>
          }
          actions={
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" onClick={() => router.push("/product")}>
                {t("product.action.backToProducts")}
              </Button>
              {canManageProducts ? (
                isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                    >
                      {t("common.cancel")}
                    </Button>
                    <Button onClick={handleSaveEdit} disabled={isSaving}>
                      {isSaving ? t("common.saving") : t("common.save")}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      className="whitespace-nowrap"
                      onClick={handleStartEdit}
                    >
                      {t("product.action.edit")}
                    </Button>
                    <Button
                      variant="outline"
                      className="whitespace-nowrap"
                      onClick={() => !isEditing && setStatusOpen(true)}
                      disabled={statusLoading || isEditing}
                    >
                      {statusLoading
                        ? t("common.loading")
                        : isActive
                          ? t("status.deactivate")
                          : t("status.activate")}
                    </Button>
                  </>
                )
              ) : null}
            </div>
          }
        />

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
            {isEditing ? (
              <div className="space-y-4">
                {draftImages.length > 0 ? (
                  <div className="space-y-3">
                    {draftImages.map((url, index) => (
                      <div
                        key={`${url}-${index}`}
                        className={`flex flex-wrap items-center gap-3 rounded-md px-2 py-2 transition ${
                          dragOverIndex === index
                            ? "bg-muted/60 ring-1 ring-foreground/10"
                            : ""
                        }`}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragEnter={() => handleDragEnter(index)}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(index)}
                        onDragEnd={() => {
                          setDraggedImageIndex(null);
                          setDragOverIndex(null);
                        }}
                      >
                        <div className="text-xs font-semibold text-muted-foreground">
                          ::
                        </div>
                        <div className="relative h-12 w-12 overflow-hidden rounded-md border border-border/60 bg-muted">
                          {url ? (
                            <Image
                              src={url}
                              alt={t("product.image.altIndex", {
                                index: index + 1,
                              })}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : null}
                        </div>
                        <Input
                          value={url}
                          onChange={(event) =>
                            handleImageUrlChange(index, event.target.value)
                          }
                          className="flex-1 min-w-[220px]"
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          {index !== 0 ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleSetPrimaryImage(index)}
                            >
                              {t("product.image.makePrimary")}
                            </Button>
                          ) : null}
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveImage(index)}
                          >
                            {t("product.image.remove")}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border/70 bg-muted/40 py-8 text-center text-sm text-muted-foreground">
                    {t("product.image.none")}
                  </div>
                )}
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {t("product.image.choose")}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event) => handleUploadImages(event.target.files)}
                    className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm file:font-semibold"
                    disabled={isUploadingImage}
                  />
                  {isUploadingImage ? (
                    <p className="text-xs text-muted-foreground">
                      {t("product.image.uploading")}
                    </p>
                  ) : null}
                  {uploadQueue.length > 0 && (
                    <div className="space-y-1">
                      {uploadQueue.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between text-xs text-muted-foreground"
                        >
                          <span className="truncate">{item.name}</span>
                          <span
                            className={
                              item.status === "error"
                                ? "text-destructive"
                                : item.status === "done"
                                  ? "text-emerald-600"
                                  : "text-muted-foreground"
                            }
                          >
                            {item.status === "uploading"
                              ? t("product.image.uploading")
                              : item.status === "done"
                                ? t("product.image.uploaded")
                                : t("product.image.uploadFailed")}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {imageUploadError ? (
                    <p className="text-xs text-destructive">
                      {imageUploadError}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {t("product.image.addUrl")}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      value={newImageUrl}
                      onChange={(event) => setNewImageUrl(event.target.value)}
                      placeholder={t("product.image.urlPlaceholder")}
                      className="flex-1 min-w-[220px]"
                    />
                    <Button
                      type="button"
                      onClick={handleAddImage}
                      disabled={!newImageUrl.trim() || isUploadingImage}
                    >
                      {t("product.image.addAction")}
                    </Button>
                  </div>
                </div>
              </div>
            ) : primaryImage ? (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => handleOpenPreview(primaryImage)}
                  className="group relative aspect-square w-full overflow-hidden rounded-lg border border-border/60 bg-muted"
                  aria-label={t("product.image.preview")}
                >
                  <Image
                    src={primaryImage}
                    alt={t("product.image.altIndex", { index: 1 })}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    unoptimized
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 text-xs font-medium text-white opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
                    {t("product.image.preview")}
                  </div>
                </button>
                {secondaryImages.length > 0 && (
                  <div className="grid grid-cols-4 gap-3">
                    {secondaryImages.map((url, index) => (
                      <button
                        key={`${url}-${index + 1}`}
                        type="button"
                        onClick={() => handleOpenPreview(url)}
                        className="group relative aspect-square overflow-hidden rounded-md border border-border/60 bg-muted"
                        aria-label={t("product.image.preview")}
                      >
                        <Image
                          src={url}
                          alt={t("product.image.altIndex", {
                            index: index + 2,
                          })}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          unoptimized
                        />
                        <div className="absolute inset-0 bg-black/0 opacity-0 transition group-hover:bg-black/20 group-hover:opacity-100" />
                      </button>
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
                {isEditing ? (
                  <Textarea
                    value={draft?.description || ""}
                    onChange={(event) =>
                      updateDraft({ description: event.target.value })
                    }
                    rows={4}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {(viewProduct || product).description ||
                      t("product.description.empty")}
                  </p>
                )}
                <div className="space-y-1">
                  {isEditing ? (
                    <>
                      {renderEditableRow(
                        t("product.label.gemstone"),
                        <Select
                          value={draft?.gemstoneType || ""}
                          onValueChange={(value) => {
                            updateDraft({ gemstoneType: value });
                            clearFieldError("gemstoneType");
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t("common.select")} />
                          </SelectTrigger>
                          <SelectContent>
                            {gemstoneOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>,
                        fieldErrors.gemstoneType,
                      )}
                      {renderEditableRow(
                        t("product.label.jewelry"),
                        <Select
                          value={draft?.jewelryType || ""}
                          onValueChange={(value) => {
                            updateDraft({ jewelryType: value });
                            clearFieldError("jewelryType");
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t("common.select")} />
                          </SelectTrigger>
                          <SelectContent>
                            {jewelryOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>,
                        fieldErrors.jewelryType,
                      )}
                      {renderEditableRow(
                        t("product.label.color"),
                        <Input
                          value={draft?.colorType || ""}
                          onChange={(event) => {
                            updateDraft({ colorType: event.target.value });
                            clearFieldError("colorType");
                          }}
                        />,
                        fieldErrors.colorType,
                      )}
                    </>
                  ) : (
                    <>
                      <InfoRowItem
                        label={t("product.label.gemstone")}
                        value={formatGemstoneTypeL(
                          (viewProduct || product).gemstoneType,
                        )}
                      />
                      <InfoRowItem
                        label={t("product.label.jewelry")}
                        value={formatJewelryTypeL(
                          (viewProduct || product).jewelryType,
                        )}
                      />
                      <InfoRowItem
                        label={t("product.label.color")}
                        value={(viewProduct || product).colorType}
                      />
                    </>
                  )}
                </div>
              </div>

              {(isEditing || dimensionEntries.length > 0) && (
                <div className="space-y-3 border-t border-border/40 pt-5">
                  <h2 className="text-base font-semibold text-foreground">
                    {t("product.info.dimensions")}
                  </h2>
                  {isEditing ? (
                    <div className="space-y-1">{renderDimensionInputs()}</div>
                  ) : (
                    <SpecificationList specs={dimensionEntries} />
                  )}
                </div>
              )}

              <div className="space-y-4 border-t border-border/40 pt-5">
                <h2 className="text-base font-semibold text-foreground">
                  {t("product.info.pricing")}
                </h2>
                <div className="grid gap-4">
                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        {t("product.label.sellingPrice")}
                      </div>
                      <Input
                        value={draft?.sellingPrice || ""}
                        onChange={(event) => {
                          updateDraft({ sellingPrice: event.target.value });
                          clearFieldError("sellingPrice");
                        }}
                      />
                      {fieldErrors.sellingPrice ? (
                        <p className="text-xs text-destructive">
                          {fieldErrors.sellingPrice}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <PriceDisplay
                      label={t("product.label.sellingPrice")}
                      value={formatMoney((viewProduct || product).sellingPrice)}
                      size="lg"
                      highlight
                    />
                  )}
                  <div className="rounded-lg border border-border/50 bg-muted/40 p-4">
                    {isEditing ? (
                      canViewBuyingPrice ? (
                        <div className="space-y-2">
                          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                            {t("product.label.buyingPrice")}
                          </div>
                          <Input
                            value={draft?.buyingPrice || ""}
                            onChange={(event) =>
                              updateDraft({ buyingPrice: event.target.value })
                            }
                          />
                        </div>
                      ) : (
                        <PriceDisplay
                          label={t("product.label.buyingPrice")}
                          value="—"
                          size="md"
                        />
                      )
                    ) : (
                      <PriceDisplay
                        label={t("product.label.buyingPrice")}
                        value={
                          showBuyingPrice
                            ? formatMoney((viewProduct || product).buyingPrice)
                            : "—"
                        }
                        size="md"
                      />
                    )}
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
                  {isEditing ? (
                    <div className="space-y-3">
                      {renderEditableRow(
                        t("product.label.certificateStatus"),
                        <Select
                          value={normalizeStatus(draft?.certificateStatus)}
                          onValueChange={(value) =>
                            updateDraft({ certificateStatus: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t("common.select")} />
                          </SelectTrigger>
                          <SelectContent>
                            {certificateStatusOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>,
                      )}
                      {renderEditableRow(
                        t("product.label.certificateId"),
                        <Input
                          value={draft?.certificateId || ""}
                          onChange={(event) => {
                            updateDraft({ certificateId: event.target.value });
                            clearFieldError("certificateId");
                          }}
                        />,
                        fieldErrors.certificateId,
                      )}
                      {renderEditableRow(
                        t("product.label.certificateAuthority"),
                        <Input
                          value={draft?.certificateAuthority || ""}
                          onChange={(event) =>
                            updateDraft({
                              certificateAuthority: event.target.value,
                            })
                          }
                        />,
                      )}
                    </div>
                  ) : (
                    <>
                      <InfoRowItem
                        label={t("product.label.certificateStatus")}
                        value={t(
                          `certificate.${normalizeStatus(
                            (viewProduct || product).certificateStatus,
                          )}`,
                        )}
                      />
                      <InfoRowItem
                        label={t("product.label.certificateId")}
                        value={(viewProduct || product).certificateId}
                      />
                      <InfoRowItem
                        label={t("product.label.certificateAuthority")}
                        value={(viewProduct || product).certificateAuthority}
                      />
                    </>
                  )}
                  {isEditing ? (
                    <div className="pt-2">
                      {renderEditableRow(
                        t("product.label.certificateImage"),
                        <Input
                          value={draft?.certificateLink || ""}
                          onChange={(event) =>
                            updateDraft({ certificateLink: event.target.value })
                          }
                        />,
                      )}
                    </div>
                  ) : (viewProduct || product).certificateLink ? (
                    <div className="flex items-center justify-between py-3 border-b border-border/40">
                      <span className="text-sm text-muted-foreground font-medium">
                        {t("product.label.certificateImage")}
                      </span>
                      <a
                        href={(viewProduct || product).certificateLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                      >
                        {t("common.view")} →
                      </a>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="flex w-[96vw] max-w-screen-xl items-center justify-center border-0 bg-transparent p-0 shadow-none sm:max-w-screen-2xl">
          <DialogHeader>
            <DialogTitle className="sr-only">
              {t("product.image.preview")}
            </DialogTitle>
          </DialogHeader>
          {previewImage ? (
            <div className="flex h-[80vh] w-full items-center justify-center sm:h-[85vh]">
              <div className="relative h-full w-full overflow-hidden rounded-2xl bg-black/80">
                <Image
                  src={previewImage}
                  alt={t("product.image.preview")}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 96vw, 90vw"
                  unoptimized
                />
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
      <AlertDialog open={statusOpen} onOpenChange={setStatusOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("status.confirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  {t("status.confirmProduct", {
                    action: isActive
                      ? t("status.deactivate")
                      : t("status.activate"),
                    name:
                      product?.gemstoneType ||
                      product?.jewelryType ||
                      t("product.label.gemstone"),
                  })}
                </p>
                <p>
                  {isActive
                    ? t("product.status.deactivateHelp")
                    : t("product.status.activateHelp")}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmStatus}
              disabled={statusLoading}
            >
              {statusLoading
                ? t("common.loading")
                : isActive
                  ? t("status.deactivate")
                  : t("status.activate")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
