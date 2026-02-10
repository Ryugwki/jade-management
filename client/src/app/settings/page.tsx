"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/layout/SectionCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";
import * as userService from "@/services/userService";

const timezoneOptions = [
  { value: "Asia/Ho_Chi_Minh", labelKey: "settings.timezone.hcm" },
  { value: "Asia/Bangkok", labelKey: "settings.timezone.bangkok" },
  { value: "Asia/Shanghai", labelKey: "settings.timezone.shanghai" },
];

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const { language, setLanguage, t } = useTranslation();
  const [tempLanguage, setTempLanguage] = useState<"vi" | "en">("en");
  const [timezone, setTimezone] = useState("Asia/Ho_Chi_Minh");
  const [prefsMessageKey, setPrefsMessageKey] = useState("");
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const timezoneLabel =
    timezoneOptions.find((option) => option.value === timezone)?.labelKey ||
    timezoneOptions[0].labelKey;

  useEffect(() => {
    if (!user) return;
    setTimezone(user.timezone || "Asia/Ho_Chi_Minh");
    setTempLanguage(language);
  }, [user, language]);

  const handleSavePreferences = async () => {
    if (!user) return;
    setIsSavingPrefs(true);
    setPrefsMessageKey("");
    try {
      await userService.updateUser(user.id, {
        language: tempLanguage,
        timezone,
      });
      setLanguage(tempLanguage);
      await refreshUser();
      setPrefsMessageKey("settings.preferencesSaved");
    } catch {
      setPrefsMessageKey("settings.preferencesFailed");
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      setPasswordMessage(t("settings.passwordMissing"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage(t("settings.passwordMismatch"));
      return;
    }
    setIsSavingPassword(true);
    setPasswordMessage("");
    try {
      await userService.changeMyPassword({
        currentPassword,
        newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage(t("settings.passwordUpdated"));
    } catch {
      setPasswordMessage(t("settings.passwordFailed"));
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("settings.badge")}
        title={t("settings.title")}
        subtitle={t("settings.subtitle")}
      />

      <section className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr] items-start">
        <div className="space-y-6">
          <SectionCard
            title={t("settings.section.preferences.title")}
            subtitle={t("settings.section.preferences.subtitle")}
            action={
              <Button onClick={handleSavePreferences} disabled={isSavingPrefs}>
                {isSavingPrefs
                  ? t("common.saving")
                  : t("settings.savePreferences")}
              </Button>
            }
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="settings-language">
                  {t("common.language")}
                </Label>
                <Select
                  value={tempLanguage}
                  onValueChange={(value) =>
                    setTempLanguage(value as "vi" | "en")
                  }
                >
                  <SelectTrigger id="settings-language">
                    <SelectValue placeholder={t("common.select")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vi">{t("language.vi")}</SelectItem>
                    <SelectItem value="en">{t("language.en")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="settings-timezone">
                  {t("common.timezone")}
                </Label>
                <Select
                  value={timezone}
                  onValueChange={(value) => setTimezone(value)}
                >
                  <SelectTrigger id="settings-timezone">
                    <SelectValue placeholder={t("common.select")} />
                  </SelectTrigger>
                  <SelectContent>
                    {timezoneOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {t(option.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Separator />
            {prefsMessageKey ? (
              <div className="text-xs text-muted-foreground">
                {t(prefsMessageKey)}
              </div>
            ) : null}
          </SectionCard>

          <SectionCard
            title={t("settings.section.security.title")}
            subtitle={t("settings.section.security.subtitle")}
            action={
              <Button
                onClick={handleChangePassword}
                disabled={isSavingPassword}
              >
                {isSavingPassword
                  ? t("common.saving")
                  : t("settings.passwordUpdate")}
              </Button>
            }
          >
            <div className="space-y-2">
              <Label htmlFor="current-password">
                {t("common.currentPassword")}
              </Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-password">{t("common.newPassword")}</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">
                  {t("common.confirmPassword")}
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            <Separator />
            {passwordMessage ? (
              <div className="text-xs text-muted-foreground">
                {passwordMessage}
              </div>
            ) : null}
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard
            title={t("settings.section.summary.title")}
            subtitle={t("settings.section.summary.subtitle")}
            contentClassName="space-y-3 text-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">
                {t("settings.section.summary.language")}
              </span>
              <span className="font-medium">
                {t(`language.${tempLanguage}`)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">
                {t("settings.section.summary.timezone")}
              </span>
              <span className="font-medium">{t(timezoneLabel)}</span>
            </div>
            <div className="rounded-lg border border-border/70 bg-muted/40 p-3 text-xs text-muted-foreground">
              {t("settings.section.summary.note")}
            </div>
          </SectionCard>

          <SectionCard
            title={t("settings.section.support.title")}
            subtitle={t("settings.section.support.subtitle")}
            contentClassName="space-y-2 text-sm text-muted-foreground"
          >
            <div>{t("settings.section.support.tip1")}</div>
            <div>{t("settings.section.support.tip2")}</div>
            <div>{t("settings.section.support.tip3")}</div>
          </SectionCard>
        </div>
      </section>
    </div>
  );
}
