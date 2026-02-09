"use client";

import {
  Bell,
  MessageSquare,
  Settings,
  ChevronDown,
  User,
  LogOut,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import * as notificationService from "@/services/notificationService";

export function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<
    notificationService.NotificationItem[]
  >([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const roleLabel =
    user?.role === "SUPER_ADMIN"
      ? t("role.superAdmin")
      : user?.role === "ADMIN"
        ? t("role.admin")
        : t("role.guest");

  const handleProfileClick = () => {
    router.push("/profile");
  };

  const handleSettingsClick = () => {
    router.push("/settings");
  };

  const handleLogoutClick = async () => {
    await logout();
    router.replace("/login");
  };

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    setNotificationsLoading(true);
    try {
      const response = await notificationService.listNotifications(6);
      setNotifications(response.notifications);
      setNotificationCount(response.unreadCount);
    } finally {
      setNotificationsLoading(false);
    }
  }, [user]);

  const getNotificationHref = (item: notificationService.NotificationItem) => {
    if (item.type === "approval") return "/permission";
    if (item.type === "audit") return "/permission";
    return "/product";
  };

  const handleNotificationClick = async (
    item: notificationService.NotificationItem,
  ) => {
    if (!item.readAt) {
      try {
        await notificationService.markNotificationRead(item.id);
        setNotifications((prev) =>
          prev.map((entry) =>
            entry.id === item.id
              ? { ...entry, readAt: new Date().toISOString() }
              : entry,
          ),
        );
        setNotificationCount((prev) => Math.max(0, prev - 1));
      } catch {
        // Keep navigation even if read update fails.
      }
    }
    router.push(getNotificationHref(item));
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllNotificationsRead();
      setNotifications((prev) =>
        prev.map((entry) => ({
          ...entry,
          readAt: entry.readAt || new Date().toISOString(),
        })),
      );
      setNotificationCount(0);
    } catch {
      // Keep current state if update fails.
    }
  };

  const formatTimestamp = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.round(diffMs / 1000);
    if (diffSeconds < 60) return "Just now";

    const diffMinutes = Math.round(diffSeconds / 60);
    if (diffMinutes < 60) {
      return new Intl.RelativeTimeFormat(undefined, {
        numeric: "auto",
      }).format(-diffMinutes, "minute");
    }

    const diffHours = Math.round(diffMinutes / 60);
    const isSameDay = now.toDateString() === date.toDateString();
    if (isSameDay) {
      const time = new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
      }).format(date);
      return `Today at ${time}`;
    }

    if (diffHours < 24) {
      return new Intl.RelativeTimeFormat(undefined, {
        numeric: "auto",
      }).format(-diffHours, "hour");
    }

    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: now.getFullYear() === date.getFullYear() ? undefined : "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
      <div className="px-6 py-3.5 flex items-center justify-between gap-6">
        {/* Left Section - Search */}
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          <div className="relative w-full">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder={t("product.search")}
              className="pl-10 bg-background border-border/70 focus:border-ring placeholder:text-muted-foreground/60"
            />
          </div>
        </div>

        {/* Center Section - Empty for balance */}
        <div className="flex-none" />

        {/* Right Section - Icons & Profile */}
        <div className="flex items-center gap-4">
          {/* Icon Buttons */}
          <div className="flex items-center gap-1">
            {/* Settings Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSettingsClick}
              className="h-9 w-9 rounded-lg border border-border/60 bg-background hover:bg-muted transition-all duration-200 group"
              title={t("nav.settings")}
            >
              <Settings
                size={18}
                className="text-muted-foreground group-hover:text-primary transition-colors duration-200"
              />
            </Button>

            {/* Messages Button */}
            {/* <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 rounded-lg border border-border/60 bg-background hover:bg-muted transition-all duration-200 group"
              title={t("nav.messages")}
            >
              <MessageSquare
                size={18}
                className="text-muted-foreground group-hover:text-primary transition-colors duration-200"
              />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-amber-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold shadow-sm">
                2
              </span>
            </Button> */}

            {/* Notifications Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-9 w-9 rounded-lg border border-border/60 bg-background hover:bg-muted transition-all duration-200 group"
                  title={t("nav.notifications")}
                >
                  <Bell
                    size={18}
                    className="text-muted-foreground group-hover:text-primary transition-colors duration-200"
                  />
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-white text-[10px] rounded-full flex items-center justify-center font-bold shadow-sm animate-pulse">
                      {notificationCount > 9 ? "9+" : notificationCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-96 mt-2 border border-border/60 bg-popover rounded-lg shadow-md"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
                  <h3 className="font-semibold text-foreground">
                    {t("nav.notifications")}
                  </h3>
                  {notificationCount > 0 && (
                    <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                      {t("nav.unreadCount", { count: notificationCount })}
                    </span>
                  )}
                </div>

                {/* Notifications List */}
                <div className="relative max-h-96 overflow-y-auto">
                  <div
                    className={cn(
                      "divide-y divide-border/40 p-2 transition duration-200",
                      notificationsLoading &&
                        "pointer-events-none blur-[1px] opacity-70",
                    )}
                  >
                    {notifications.length > 0 ? (
                      notifications.map((item) => (
                        <DropdownMenuItem
                          key={item.id}
                          onClick={() => handleNotificationClick(item)}
                          className={cn(
                            "flex flex-col items-start gap-2 px-3 py-2.5 rounded-md transition-colors duration-200 cursor-pointer mb-1 last:mb-0",
                            item.readAt
                              ? "hover:bg-muted"
                              : "bg-primary/5 hover:bg-primary/10",
                          )}
                        >
                          <div className="flex w-full items-start justify-between gap-2">
                            <span
                              className={cn(
                                "text-sm font-medium leading-snug",
                                item.readAt
                                  ? "text-muted-foreground"
                                  : "text-foreground font-semibold",
                              )}
                            >
                              {item.title}
                            </span>
                            {!item.readAt && (
                              <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />
                            )}
                          </div>
                          {item.message && (
                            <span
                              className={cn(
                                "text-xs leading-snug max-w-xs",
                                item.readAt
                                  ? "text-muted-foreground"
                                  : "text-foreground/80",
                              )}
                            >
                              {item.message}
                            </span>
                          )}
                          <span className="text-[11px] text-muted-foreground">
                            {formatTimestamp(item.createdAt)}
                          </span>
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center text-xs text-muted-foreground">
                        {t("nav.noNotifications")}
                      </div>
                    )}
                  </div>
                  <div
                    className={cn(
                      "absolute inset-0 flex items-start justify-center pt-10 bg-popover/40 backdrop-blur-sm transition-opacity duration-200",
                      notificationsLoading
                        ? "opacity-100"
                        : "opacity-0 pointer-events-none",
                    )}
                  >
                    <div className="flex items-center gap-2 rounded-md border border-border/60 bg-background/80 px-3 py-2 text-xs text-muted-foreground shadow-sm">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/40 border-t-primary" />
                      {t("common.loading")}
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                {notifications.length > 0 && (
                  <div className="border-t border-border/40 flex items-center divide-x divide-border/40 px-2 py-2">
                    <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault();
                        if (!notificationsLoading) {
                          loadNotifications();
                        }
                      }}
                      disabled={notificationsLoading}
                      className="flex-1 justify-center text-xs text-muted-foreground hover:text-primary font-medium transition-colors"
                    >
                      {t("nav.refresh")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleMarkAllRead}
                      className="flex-1 justify-center text-xs text-muted-foreground hover:text-primary font-medium transition-colors"
                    >
                      {t("nav.markAllRead")}
                    </DropdownMenuItem>
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-border/50" />

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-primary/20">
                <Avatar className="h-8 w-8 border border-border/50">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {user?.name?.[0]?.toUpperCase() || t("nav.userInitial")}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-semibold text-foreground leading-none">
                    {user?.name || t("nav.userFallback")}
                  </p>
                  <p className="text-xs text-muted-foreground leading-tight mt-1">
                    {roleLabel}
                  </p>
                </div>
                <ChevronDown
                  size={16}
                  className="text-muted-foreground group-hover:text-foreground transition-colors duration-200 ml-1"
                />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-56 mt-2 shadow-lg border border-border/50 bg-popover rounded-lg p-1.5"
            >
              {/* User Info */}
              <div className="px-3 py-2.5 border-b border-border/40 mb-1">
                <p className="text-sm font-semibold text-foreground">
                  {user?.name || t("nav.userFallback")}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {user?.email && `${user.email}`}
                </p>
              </div>

              {/* Menu Items */}
              <DropdownMenuItem
                onClick={handleProfileClick}
                className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted transition-colors duration-200 cursor-pointer text-sm"
              >
                <User size={16} className="text-muted-foreground" />
                <span className="font-medium flex-1">{t("nav.profile")}</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={handleSettingsClick}
                className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted transition-colors duration-200 cursor-pointer text-sm"
              >
                <Settings size={16} className="text-muted-foreground" />
                <span className="font-medium flex-1">{t("nav.settings")}</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1 bg-border/40" />

              {/* Logout */}
              <DropdownMenuItem
                onClick={handleLogoutClick}
                className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-destructive/10 transition-colors duration-200 cursor-pointer text-sm text-destructive hover:text-destructive"
              >
                <LogOut size={16} />
                <span className="font-medium flex-1">{t("nav.logout")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
