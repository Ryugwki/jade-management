"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { useLoading } from "@/contexts/LoadingContext";
import { useFeedback } from "@/contexts/FeedbackContext";

export default function LoginPage() {
  const router = useRouter();
  const { login, loginGuest } = useAuth();
  const { t } = useTranslation();
  const { startLoading, stopLoading } = useLoading();
  const { showFeedback } = useFeedback();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGuestSubmitting, setIsGuestSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    startLoading();
    try {
      await login({ email, password });
      showFeedback({
        variant: "success",
        message: t("auth.loginSuccess"),
      });
      router.replace("/");
    } catch {
      const message = t("auth.invalidCredentials");
      setError(message);
      showFeedback({ variant: "error", message });
    } finally {
      stopLoading();
      setIsSubmitting(false);
    }
  };

  const handleGuestLogin = async () => {
    setError("");
    setIsGuestSubmitting(true);
    startLoading();
    try {
      await loginGuest();
      showFeedback({
        variant: "success",
        message: t("auth.loginSuccess"),
      });
      router.replace("/");
    } catch {
      const message = t("auth.guestFailed");
      setError(message);
      showFeedback({ variant: "error", message });
    } finally {
      stopLoading();
      setIsGuestSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_55%),radial-gradient(circle_at_80%_20%,_rgba(234,179,8,0.08),_transparent_45%)] text-foreground flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card className="border-border/70 shadow-[0_20px_50px_rgba(15,23,42,0.12)] bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">{t("auth.signIn")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error ? (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 px-3 py-2 rounded-md">
                  {error}
                </div>
              ) : null}
              <div className="space-y-2">
                <Label>{t("auth.email")}</Label>
                <Input
                  type="email"
                  placeholder={t("auth.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t("auth.password")}</Label>
                <Input
                  type="password"
                  placeholder={t("auth.passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary text-primary-foreground hover:bg-[color:var(--jade-600)]"
              >
                {isSubmitting ? t("auth.signingIn") : t("auth.login")}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isGuestSubmitting}
                onClick={handleGuestLogin}
                className="w-full"
              >
                {isGuestSubmitting
                  ? t("auth.enteringGuest")
                  : t("auth.loginGuest")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
