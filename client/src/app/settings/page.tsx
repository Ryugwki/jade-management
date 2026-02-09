"use client";

import { useEffect, useState } from "react";
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

const display = Playfair_Display({ subsets: ["latin"], weight: ["600"] });
const body = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

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
    <div
      className={`${body.className} space-y-6 bg-[radial-gradient(circle_at_70%_15%,_rgba(16,185,129,0.12),_transparent_45%),radial-gradient(circle_at_10%_80%,_rgba(234,179,8,0.12),_transparent_45%)] p-2 sm:p-4`}
    >
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-[linear-gradient(120deg,var(--surface-1),var(--surface-2))] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <Badge className="bg-slate-900 text-white">
              {t("settings.badge")}
            </Badge>
            <h1 className={`${display.className} text-3xl md:text-4xl mt-2`}>
              {t("settings.title")}
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl mt-2">
              {t("settings.subtitle")}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr] items-start">
        <div className="space-y-6">
          <Card className="border-border/60 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>{t("settings.section.preferences.title")}</CardTitle>
                <CardDescription>
                  {t("settings.section.preferences.subtitle")}
                </CardDescription>
              </div>
              <Button
                className="bg-primary text-primary-foreground hover:bg-[color:var(--jade-600)]"
                onClick={handleSavePreferences}
                disabled={isSavingPrefs}
              >
                {isSavingPrefs
                  ? t("common.saving")
                  : t("settings.savePreferences")}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>{t("settings.section.security.title")}</CardTitle>
                <CardDescription>
                  {t("settings.section.security.subtitle")}
                </CardDescription>
              </div>
              <Button
                className="bg-primary text-primary-foreground hover:bg-[color:var(--jade-600)]"
                onClick={handleChangePassword}
                disabled={isSavingPassword}
              >
                {isSavingPassword
                  ? t("common.saving")
                  : t("settings.passwordUpdate")}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  <Label htmlFor="new-password">
                    {t("common.newPassword")}
                  </Label>
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
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border/60 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
            <CardHeader>
              <CardTitle>{t("settings.section.summary.title")}</CardTitle>
              <CardDescription>
                {t("settings.section.summary.subtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
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
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
            <CardHeader>
              <CardTitle>{t("settings.section.support.title")}</CardTitle>
              <CardDescription>
                {t("settings.section.support.subtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div>{t("settings.section.support.tip1")}</div>
              <div>{t("settings.section.support.tip2")}</div>
              <div>{t("settings.section.support.tip3")}</div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
