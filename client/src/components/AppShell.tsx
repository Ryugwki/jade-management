"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { useLoading } from "@/contexts/LoadingContext";
import { GlobalLoadingOverlay } from "@/components/GlobalLoadingOverlay";
import { FeedbackModal } from "@/components/FeedbackModal";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isReady } = useAuth();
  const { t } = useTranslation();
  const { startLoading, stopLoading } = useLoading();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isLogin = pathname === "/login";
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (!isReady) return;
    if (!user && !isLogin) {
      router.replace("/login");
    }
    if (user && isLogin) {
      router.replace("/");
    }
  }, [user, isReady, isLogin, router]);

  useEffect(() => {
    if (isLogin) return;
    if (!hasNavigated.current) {
      hasNavigated.current = true;
      return;
    }
    startLoading();
    const timer = window.setTimeout(() => stopLoading(), 500);
    return () => window.clearTimeout(timer);
  }, [pathname, searchParams?.toString(), isLogin, startLoading, stopLoading]);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-sm text-muted-foreground">
          {t("common.loading")}
        </div>
      </div>
    );
  }

  if (isLogin) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        {children}
        <GlobalLoadingOverlay />
        <FeedbackModal />
      </main>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Navbar />
        <main className="flex-1 overflow-auto bg-muted/30 p-6 lg:p-8">
          {children}
        </main>
      </div>
      <GlobalLoadingOverlay />
      <FeedbackModal />
    </div>
  );
}
