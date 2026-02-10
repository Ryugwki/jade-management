"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/layout/SectionCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { uploadImageBase64 } from "@/services/uploadService";
import * as userService from "@/services/userService";

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    avatarUrl: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const roleLabel =
    user?.role === "SUPER_ADMIN"
      ? t("role.superAdmin")
      : user?.role === "ADMIN"
        ? t("role.admin")
        : t("role.guest");

  const initials = useMemo(() => {
    const source = user?.name || t("common.profile");
    return source
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [user?.name]);

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name || "",
      phone: user.phone || "",
      address: user.address || "",
      avatarUrl: user.avatarUrl || "",
    });
    setAvatarPreview("");
    setAvatarFile(null);
  }, [user]);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const preview = await fileToBase64(file);
    setAvatarPreview(preview);
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setMessage("");
    try {
      let avatarUrl = form.avatarUrl;
      if (avatarFile) {
        const base64 = await fileToBase64(avatarFile);
        const uploaded = await uploadImageBase64(base64, "avatars");
        avatarUrl = uploaded.url;
      }

      await userService.updateUser(user.id, {
        name: form.name,
        phone: form.phone,
        address: form.address,
        avatarUrl,
      });

      await refreshUser();
      setForm((prev) => ({ ...prev, avatarUrl }));
      setAvatarFile(null);
      setAvatarPreview("");
      setMessage(t("profile.updated"));
    } catch {
      setMessage(t("profile.updateFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={roleLabel}
        title={
          <span className="inline-flex items-center gap-3">
            <Avatar className="h-10 w-10">
              {avatarPreview || form.avatarUrl ? (
                <AvatarImage
                  src={avatarPreview || form.avatarUrl}
                  alt={user?.name || t("profile.avatar")}
                />
              ) : null}
              <AvatarFallback className="bg-primary/80 text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span>{user?.name || t("common.profile")}</span>
          </span>
        }
        subtitle={user?.email || t("common.placeholder")}
        actions={
          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? t("common.saving") : t("profile.save")}
            </Button>
            {message ? (
              <div className="text-xs text-muted-foreground">{message}</div>
            ) : null}
          </div>
        }
      />

      <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr] items-start">
        <SectionCard
          title={t("profile.section.personal.title")}
          subtitle={t("profile.section.personal.subtitle")}
          contentClassName="space-y-5"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="profile-name">{t("profile.displayName")}</Label>
              <Input
                id="profile-name"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-role">{t("common.role")}</Label>
              <Input id="profile-role" value={roleLabel} readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-email">{t("common.email")}</Label>
              <Input id="profile-email" value={user?.email || ""} readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-phone">{t("common.phone")}</Label>
              <Input
                id="profile-phone"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder={t("profile.phonePlaceholder")}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-address">{t("common.address")}</Label>
            <Input
              id="profile-address"
              value={form.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder={t("profile.addressPlaceholder")}
            />
          </div>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard
            title={t("profile.section.avatar.title")}
            subtitle={t("profile.section.avatar.subtitle")}
            contentClassName="space-y-3"
          >
            <div className="flex items-center gap-3 rounded-md border border-border/70 bg-background px-3 py-2">
              <input
                id="profile-avatar"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="sr-only"
              />
              <Label
                htmlFor="profile-avatar"
                className="cursor-pointer rounded-md border border-border/70 bg-muted px-3 py-1 text-sm font-medium hover:bg-muted/80"
              >
                {t("profile.chooseFiles")}
              </Label>
              <span className="text-sm text-muted-foreground truncate">
                {avatarFile?.name || t("profile.noFile")}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {t("profile.avatarHint")}
            </div>
          </SectionCard>

          <SectionCard
            title={t("profile.notesTitle")}
            contentClassName="space-y-3 text-sm text-muted-foreground"
          >
            <div>{t("profile.note1")}</div>
            <div>{t("profile.note2")}</div>
            <div>{t("profile.note3")}</div>
          </SectionCard>
        </div>
      </section>
    </div>
  );
}
