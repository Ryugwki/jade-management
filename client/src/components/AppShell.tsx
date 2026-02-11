"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { useLoading } from "@/contexts/LoadingContext";
import { GlobalLoadingOverlay } from "@/components/GlobalLoadingOverlay";
import { FeedbackModal } from "@/components/FeedbackModal";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isReady } = useAuth();
  const { t } = useTranslation();
  const { startLoading, stopLoading } = useLoading();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsStr = searchParams?.toString();
  const isLogin = pathname === "/login";
  const isPublicGuestRoute = pathname.startsWith("/product");
  const hasNavigated = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    // Allow guest users to access the app
    const isGuestUser = user?.isGuest === true;

    // Only redirect to login if no user and not a public guest route
    if (!user && !isLogin && !isPublicGuestRoute) {
      router.replace("/login");
    }

    // Redirect authenticated (non-guest) users away from login page
    if (user && !isGuestUser && isLogin) {
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
  }, [pathname, searchParamsStr, isLogin, startLoading, stopLoading]);

  const shouldHoldForGuest = isPublicGuestRoute && !user;

  // Prevent hydration mismatch by showing loading state until mounted
  if (!mounted || !isReady || shouldHoldForGuest) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-background text-foreground"
        suppressHydrationWarning
      >
        <div className="text-sm text-muted-foreground" suppressHydrationWarning>
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
        <Navbar onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-auto bg-muted/30 p-4 sm:p-6 xl:p-10">
          {children}
        </main>
      </div>
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <Sidebar variant="mobile" onNavigate={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>
      <GlobalLoadingOverlay />
      <FeedbackModal />
    </div>
  );
}
