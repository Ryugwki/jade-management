"use client";

import { useEffect, useMemo, useState } from "react";
import { Playfair_Display, Space_Grotesk } from "next/font/google";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { uploadImageBase64 } from "@/services/uploadService";
import * as userService from "@/services/userService";

const display = Playfair_Display({ subsets: ["latin"], weight: ["600"] });
const body = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

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
    <div
      className={`${body.className} space-y-6 bg-[radial-gradient(circle_at_75%_10%,_rgba(16,185,129,0.12),_transparent_45%),radial-gradient(circle_at_10%_60%,_rgba(234,179,8,0.12),_transparent_40%)] p-2 sm:p-4`}
    >
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-[linear-gradient(120deg,var(--surface-1),var(--surface-2))] p-6 shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
        <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 bg-white/10 text-white">
              {avatarPreview || form.avatarUrl ? (
                <AvatarImage
                  src={avatarPreview || form.avatarUrl}
                  alt={user?.name || t("profile.avatar")}
                />
              ) : null}
              <AvatarFallback className="bg-primary/80 text-white text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h1
                  className={`${display.className} text-2xl md:text-3xl text-foreground`}
                >
                  {user?.name || t("common.profile")}
                </h1>
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  {roleLabel}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {user?.email || t("common.placeholder")}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 md:ml-auto">
            <Button
              className="bg-primary text-primary-foreground hover:bg-[color:var(--jade-600)]"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? t("common.saving") : t("profile.save")}
            </Button>
            {message ? (
              <div className="text-xs text-muted-foreground flex items-center">
                {message}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr] items-start">
        <Card className="border-border/60 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {t("profile.section.personal.title")}
            </CardTitle>
            <CardDescription>
              {t("profile.section.personal.subtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
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
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/60 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
            <CardHeader>
              <CardTitle>{t("profile.section.avatar.title")}</CardTitle>
              <CardDescription>
                {t("profile.section.avatar.subtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
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
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
            <CardHeader>
              <CardTitle>{t("profile.notesTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div>{t("profile.note1")}</div>
              <div>{t("profile.note2")}</div>
              <div>{t("profile.note3")}</div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
